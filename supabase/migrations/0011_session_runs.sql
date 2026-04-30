-- =====================================================================
-- 0011: session_runs + session_participants
--
-- 명세 핵심 모델:
--  - SessionRun = 실제 굴려진(또는 굴릴) 세션 1회 인스턴스.
--  - 같은 시나리오를 여러 번 굴려도 SessionRun 은 굴림마다 별도 row.
--  - group_id 가 NULLABLE — 단발 케이스(외부 친구들과 일회성)는 group=null
--    에서 운영. 권한은 participants 만으로 결정. M3.3 에서 단발 UI.
--  - participants 가 1차 데이터 — 캐릭터·플레이어를 모두 link.
--
-- 권한 술어 (이후 모든 세션 관련 RLS 의 베이스):
--   can_see_session_run(id) =
--     (그룹 있고 그룹 멤버) OR (참여자에 본인 있음)
-- =====================================================================

create type session_status as enum ('planned', 'in_progress', 'completed', 'cancelled');
create type session_role   as enum ('gm', 'player', 'guest');

create table public.session_runs (
  id            uuid        primary key default gen_random_uuid(),
  -- nullable: 그룹에 속하지 않는 단발(트위터 모임 등). M3.3 에서 활용.
  group_id      uuid        references public.groups (id) on delete cascade,
  -- nullable: 시나리오 미정 상태로 일정만 잡는 경우.
  scenario_id   uuid        references public.scenarios (id) on delete set null,
  title         text        not null check (char_length(btrim(title)) between 1 and 200),
  status        session_status not null default 'planned',
  scheduled_at  timestamptz,
  started_at    timestamptz,
  ended_at      timestamptz,
  notes         text,
  data          jsonb       not null default '{}'::jsonb,
  created_by    uuid        not null references auth.users (id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index session_runs_group_idx     on public.session_runs (group_id);
create index session_runs_scenario_idx  on public.session_runs (scenario_id);
create index session_runs_scheduled_idx on public.session_runs (group_id, scheduled_at desc);
create index session_runs_creator_idx   on public.session_runs (created_by);

create trigger session_runs_set_updated_at
  before update on public.session_runs
  for each row execute function public.tg_set_updated_at();

create table public.session_participants (
  session_run_id  uuid    not null references public.session_runs (id) on delete cascade,
  user_id         uuid    not null references auth.users (id) on delete cascade,
  role            session_role not null default 'player',
  -- 참여 캐릭터 link. PL 만, GM 은 보통 null. 캐릭터 삭제 시 link 만 끊기고 참여 row 는 유지.
  character_id    uuid    references public.characters (id) on delete set null,
  joined_at       timestamptz not null default now(),
  primary key (session_run_id, user_id)
);

create index session_participants_user_idx      on public.session_participants (user_id);
create index session_participants_character_idx on public.session_participants (character_id);

-- =====================================================================
-- 권한 술어
-- =====================================================================

create or replace function public.can_see_session_run(p_session_run_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.session_runs sr
    where sr.id = p_session_run_id
      and (
        (sr.group_id is not null and public.is_group_member(sr.group_id))
        or exists (
          select 1 from public.session_participants p
           where p.session_run_id = sr.id and p.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.is_session_creator(p_session_run_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.session_runs sr
     where sr.id = p_session_run_id and sr.created_by = auth.uid()
  );
$$;

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.session_runs enable row level security;

create policy session_runs_select_visible
  on public.session_runs for select
  using (
    (group_id is not null and public.is_group_member(group_id))
    or exists (
      select 1 from public.session_participants p
       where p.session_run_id = id and p.user_id = auth.uid()
    )
  );

create policy session_runs_insert_member
  on public.session_runs for insert
  with check (
    created_by = auth.uid()
    and (group_id is null or public.is_group_member(group_id))
  );

create policy session_runs_update_creator
  on public.session_runs for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy session_runs_delete_creator
  on public.session_runs for delete
  using (created_by = auth.uid());

grant select, insert, update, delete on public.session_runs to authenticated;

-- session_participants RLS
alter table public.session_participants enable row level security;

create policy session_participants_select_visible
  on public.session_participants for select
  using (public.can_see_session_run(session_run_id));

-- 추가는 세션 등록자(GM) 또는 본인이 직접 (자기 자신을 등록할 때).
create policy session_participants_insert_creator_or_self
  on public.session_participants for insert
  with check (
    user_id = auth.uid()
    or public.is_session_creator(session_run_id)
  );

create policy session_participants_update_creator_or_self
  on public.session_participants for update
  using (
    user_id = auth.uid() or public.is_session_creator(session_run_id)
  )
  with check (
    user_id = auth.uid() or public.is_session_creator(session_run_id)
  );

create policy session_participants_delete_creator_or_self
  on public.session_participants for delete
  using (
    user_id = auth.uid() or public.is_session_creator(session_run_id)
  );

grant select, insert, update, delete on public.session_participants to authenticated;

-- =====================================================================
-- RPC: 세션 생성 + 등록자 자동 GM 참여
-- =====================================================================

create or replace function public.create_session_run_rpc(
  p_group_id     uuid,
  p_scenario_id  uuid default null,
  p_title        text default null,
  p_scheduled_at timestamptz default null
)
returns public.session_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_row   public.session_runs;
  v_title text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if p_group_id is not null and not exists (
    select 1 from public.group_members
     where group_id = p_group_id and user_id = v_uid
  ) then
    raise exception 'NOT_GROUP_MEMBER' using errcode = '42501';
  end if;

  -- 제목 자동 생성 — 사용자 지정이 우선, 없으면 시나리오 제목 + 날짜
  v_title := nullif(btrim(coalesce(p_title, '')), '');
  if v_title is null then
    if p_scenario_id is not null then
      select s.title into v_title from public.scenarios s where s.id = p_scenario_id;
    end if;
    if v_title is null then
      v_title := '제목 없음';
    end if;
    if p_scheduled_at is not null then
      v_title := v_title || ' — ' || to_char(p_scheduled_at at time zone 'Asia/Seoul', 'YYYY-MM-DD');
    end if;
  end if;

  insert into public.session_runs (group_id, scenario_id, title, scheduled_at, created_by)
  values (p_group_id, p_scenario_id, v_title, p_scheduled_at, v_uid)
  returning * into v_row;

  -- 등록자를 자동 GM 으로 등록
  insert into public.session_participants (session_run_id, user_id, role)
  values (v_row.id, v_uid, 'gm');

  return v_row;
end;
$$;

grant execute on function public.create_session_run_rpc(uuid, uuid, text, timestamptz)
  to authenticated;
