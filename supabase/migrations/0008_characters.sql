-- =====================================================================
-- 0008: characters — 시스템별 캐릭터 시트
--
-- 데이터 모델 전략:
--  - 자주 조회/필터하는 필드(이름, 시스템, 상태, 직업)는 컬럼으로
--  - 시스템별 가변 필드(능력치, 기술, 무기, 백스토리)는 jsonb 컬럼 data 에
--  - 같은 group_id 안에서 RLS = is_group_member() 적용
--  - owner_id 는 BEFORE INSERT 트리거가 auth.uid() 로 자동 세팅
--  - 생성은 RPC 로 일원화 (그룹 멤버십 검증)
-- =====================================================================

create type trpg_system as enum (
  'coc7',
  'dnd5e',
  'dungeon_world',
  'fiasco',
  'insane',
  'shahonkok',
  'custom'
);

create type character_status as enum ('active', 'retired', 'dead');

create table public.characters (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  owner_id    uuid not null references auth.users (id)   on delete cascade,
  system      trpg_system not null,
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  occupation  text,
  status      character_status not null default 'active',
  portrait_url text,
  -- 시스템별 가변 필드 (CoC 7e: characteristics, skills, weapons, backstory 등)
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index characters_group_idx  on public.characters (group_id);
create index characters_owner_idx  on public.characters (owner_id);
create index characters_status_idx on public.characters (group_id, status);

create trigger characters_set_updated_at
  before update on public.characters
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.characters enable row level security;

-- 같은 그룹 멤버는 그룹 내 캐릭터를 본다.
create policy characters_select_member
  on public.characters for select
  using (public.is_group_member(group_id));

-- 직접 INSERT 는 막고 RPC 로만 (멤버십 검증을 한 곳에서).
-- 그래도 RLS 만으로도 본인+멤버 케이스는 허용해 두면 INSERT 트리거 기반 흐름이 가능.
create policy characters_insert_member
  on public.characters for insert
  with check (public.is_group_member(group_id) and owner_id = auth.uid());

-- 본인만 자기 캐릭터 수정/삭제.
create policy characters_update_owner
  on public.characters for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy characters_delete_owner
  on public.characters for delete
  using (owner_id = auth.uid());

grant select, insert, update, delete on public.characters to authenticated;

-- =====================================================================
-- 생성 RPC — 그룹 멤버십 검증 + owner 자동 세팅
-- =====================================================================

create or replace function public.create_character_rpc(
  p_group_id   uuid,
  p_system     trpg_system,
  p_name       text,
  p_occupation text default null,
  p_data       jsonb default '{}'::jsonb
)
returns public.characters
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_char public.characters;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.group_members
     where group_id = p_group_id
       and user_id  = v_uid
  ) then
    raise exception 'NOT_GROUP_MEMBER' using errcode = '42501';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'NAME_REQUIRED' using errcode = '23514';
  end if;

  insert into public.characters (group_id, owner_id, system, name, occupation, data)
  values (
    p_group_id,
    v_uid,
    p_system,
    btrim(p_name),
    nullif(btrim(coalesce(p_occupation, '')), ''),
    coalesce(p_data, '{}'::jsonb)
  )
  returning * into v_char;

  return v_char;
end;
$$;

grant execute on function public.create_character_rpc(uuid, trpg_system, text, text, jsonb) to authenticated;
