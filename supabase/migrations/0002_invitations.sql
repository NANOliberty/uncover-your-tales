-- =====================================================================
-- UYT M1.4 — group_invitations + redeem RPC
--
-- 친구 그룹 운영 모델: 모든 가입은 초대를 거친다.
-- group_members 의 INSERT 정책은 admin 전용으로 막혀있고,
-- 일반 사용자는 redeem_invite() RPC 를 통해서만 자기 자신을 그룹에 추가한다.
-- RPC 가 SECURITY DEFINER 이므로 RLS 를 안전하게 우회하면서도
-- 코드 검증 / 만료 / 사용 횟수 / 중복 가입 / 자기 그룹 검증을 한 곳에서 한다.
-- =====================================================================

create table public.group_invitations (
  id          uuid        primary key default gen_random_uuid(),
  group_id    uuid        not null references public.groups (id) on delete cascade,
  -- 사람이 입력하기 쉬운 6~12 자리 base32-ish 코드. 발급 시 클라이언트가 모르고
  -- 서버 측에서 생성. 충돌 시 unique 제약으로 즉시 실패하면 재시도.
  code        text        not null unique
                check (code ~ '^[A-Z0-9]{6,12}$'),
  created_by  uuid        not null references auth.users (id) on delete cascade,
  -- 단일 사용? 단일이면 첫 사용 후 비활성. 다회용이면 expires_at 이나 max_uses 로 제한.
  max_uses    integer     not null default 1 check (max_uses >= 1),
  uses        integer     not null default 0 check (uses >= 0),
  expires_at  timestamptz,
  -- 게스트로만 가입시킬 수도 있다 (관리자 결정). 기본은 일반 멤버.
  default_role group_role not null default 'member',
  -- 명시적 회수. (uses 가 max_uses 에 도달했어도, 빈 슬롯이 만들어지지 않도록 별도 필드)
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index group_invitations_group_idx on public.group_invitations (group_id);
create index group_invitations_active_idx on public.group_invitations (group_id)
  where revoked_at is null;

-- RLS -----------------------------------------------------------------

alter table public.group_invitations enable row level security;

-- 그룹 멤버는 자기 그룹의 초대 목록을 본다 (관리자가 만든 링크를 다른 멤버도 공유 가능).
-- 코드 자체는 노출되지만 멤버 사이에서는 문제없다.
create policy group_invitations_select_member
  on public.group_invitations for select
  using (public.is_group_member(group_id));

-- 발급은 관리자만.
create policy group_invitations_insert_admin
  on public.group_invitations for insert
  with check (public.is_group_admin(group_id) and created_by = auth.uid());

-- 회수/수정도 관리자만. uses 증가는 SECURITY DEFINER RPC 가 담당하므로
-- 일반 UPDATE 정책은 관리자에게만 허용해도 충분하다.
create policy group_invitations_update_admin
  on public.group_invitations for update
  using (public.is_group_admin(group_id))
  with check (public.is_group_admin(group_id));

create policy group_invitations_delete_admin
  on public.group_invitations for delete
  using (public.is_group_admin(group_id));

grant select, insert, update, delete on public.group_invitations to authenticated;

-- 코드 미리보기를 위한 중간 단계 ---------------------------------------
-- 초대 코드를 입력했을 때 "어떤 그룹의 초대인지" 만 보여주고 가입은 별도 버튼으로.
-- 이때 group_invitations RLS 는 비멤버를 막으므로 별도 RPC 가 필요하다.
create or replace function public.peek_invite(p_code text)
returns table (
  group_id    uuid,
  group_name  text,
  group_slug  text,
  default_role group_role,
  expires_at  timestamptz,
  remaining_uses integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
    select g.id, g.name, g.slug, i.default_role, i.expires_at,
           greatest(i.max_uses - i.uses, 0)
      from public.group_invitations i
      join public.groups g on g.id = i.group_id
     where i.code = upper(p_code)
       and i.revoked_at is null
       and (i.expires_at is null or i.expires_at > now())
       and i.uses < i.max_uses
     limit 1;
end;
$$;

grant execute on function public.peek_invite(text) to anon, authenticated;

-- 실제 가입 ----------------------------------------------------------
-- 모든 검증을 한 트랜잭션 안에서: 코드 유효 / 만료 / 횟수 / 중복 가입.
-- 성공 시 group_id 를 돌려준다 (클라이언트가 라우팅에 사용).
create or replace function public.redeem_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.group_invitations;
  v_already boolean;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_invite
    from public.group_invitations
   where code = upper(p_code)
     for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_invite.revoked_at is not null then
    raise exception 'INVITE_REVOKED';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'INVITE_EXPIRED';
  end if;

  if v_invite.uses >= v_invite.max_uses then
    raise exception 'INVITE_EXHAUSTED';
  end if;

  select exists (
    select 1 from public.group_members
     where group_id = v_invite.group_id
       and user_id  = v_uid
  ) into v_already;

  if v_already then
    -- 이미 멤버 — 카운트는 증가시키지 않고 group_id 만 반환해 클라이언트가 그쪽으로 보낸다.
    return v_invite.group_id;
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_invite.group_id, v_uid, v_invite.default_role);

  update public.group_invitations
     set uses = uses + 1
   where id = v_invite.id;

  return v_invite.group_id;
end;
$$;

grant execute on function public.redeem_invite(text) to authenticated;

-- 코드 자동 생성 ------------------------------------------------------
-- 클라이언트가 코드를 모르고 만들도록, 서버에서 base32-ish 6자리 생성.
-- 충돌 시 unique 제약 위반 → 호출자가 재시도.
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  -- 1, I, 0, O 같은 헷갈리는 문자 제외.
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  i int;
begin
  for i in 1..6 loop
    v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
  end loop;
  return v_code;
end;
$$;

grant execute on function public.generate_invite_code() to authenticated;
