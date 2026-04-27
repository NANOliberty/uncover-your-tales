-- =====================================================================
-- UYT M1.1 — profiles / groups / group_members
--
-- 모든 향후 콘텐츠(캐릭터, 시나리오, 세션 등)는 group_id FK 를 가지며,
-- RLS 는 "내가 그 그룹의 멤버인가?" 한 가지 술어로 통일된다.
-- 그래서 이번 마이그레이션이 가장 중요하다 — 여기서 정의한
-- `is_group_member(group_id)` 함수가 앞으로 모든 정책의 베이스가 된다.
-- =====================================================================

create extension if not exists "pgcrypto";

-- 도메인 enum -----------------------------------------------------------

create type group_role as enum ('admin', 'member', 'guest');

-- (c) 공개 플랫폼 확장 대비 — 지금은 invite_only 만 활성 사용.
-- 컬럼은 두되 UI 에서는 invite_only 를 강제한다.
create type group_visibility as enum ('private', 'invite_only', 'public');

-- profiles -------------------------------------------------------------
-- auth.users 와 1:1, public 에서 안전하게 조회할 수 있는 사용자 정보.

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text        not null,
  bio           text,
  avatar_url    text,
  -- Discord 연동(친구 그룹 운영의 핵심) — 모집 마감 시 자동 멘션용
  discord_user_id  text unique,
  discord_username text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_display_name_idx on public.profiles using gin (to_tsvector('simple', display_name));

-- groups ---------------------------------------------------------------

create table public.groups (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null unique
                check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name         text        not null check (char_length(name) between 1 and 60),
  description  text,
  logo_url     text,
  visibility   group_visibility not null default 'invite_only',
  created_by   uuid        not null references auth.users (id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- group_members --------------------------------------------------------

create table public.group_members (
  group_id   uuid         not null references public.groups (id) on delete cascade,
  user_id    uuid         not null references auth.users (id)   on delete cascade,
  role       group_role   not null default 'member',
  joined_at  timestamptz  not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

-- updated_at 자동 갱신 ------------------------------------------------

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.tg_set_updated_at();

-- auth.users 가입 시 profiles 행 자동 생성 ---------------------------
-- OAuth 메타데이터에서 이름/아바타를 끌어와 초기값으로 사용.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, discord_user_id, discord_username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'preferred_username',
      split_part(new.email, '@', 1),
      'PL'
    ),
    new.raw_user_meta_data->>'avatar_url',
    case when new.raw_app_meta_data->>'provider' = 'discord'
         then new.raw_user_meta_data->>'provider_id' end,
    case when new.raw_app_meta_data->>'provider' = 'discord'
         then new.raw_user_meta_data->>'user_name' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 그룹 생성 시 생성자를 admin 으로 자동 등록 ------------------------

create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- =====================================================================
-- RLS — 모든 정책의 핵심 술어
-- =====================================================================

-- 멤버십 체크 헬퍼 (security definer 로 RLS 회귀 회피)
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
     where group_id = p_group_id
       and user_id  = auth.uid()
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
     where group_id = p_group_id
       and user_id  = auth.uid()
       and role     = 'admin'
  );
$$;

-- profiles RLS ---------------------------------------------------------
-- 같은 그룹 멤버끼리만 서로의 프로필을 본다. 본인 프로필은 항상 본인이 수정.

alter table public.profiles enable row level security;

create policy profiles_select_self
  on public.profiles for select
  using (id = auth.uid());

create policy profiles_select_groupmate
  on public.profiles for select
  using (
    exists (
      select 1
        from public.group_members me
        join public.group_members them
          on me.group_id = them.group_id
       where me.user_id   = auth.uid()
         and them.user_id = profiles.id
    )
  );

create policy profiles_update_self
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- groups RLS -----------------------------------------------------------

alter table public.groups enable row level security;

-- 멤버는 자기 그룹을 본다.
create policy groups_select_member
  on public.groups for select
  using (public.is_group_member(id));

-- (c) 확장 시점에 켜질 정책: visibility = 'public' 이면 누구나 select.
-- 지금은 invite_only 강제이므로 비활성 — 컬럼만 존재.
-- create policy groups_select_public on public.groups for select using (visibility = 'public');

-- 인증 사용자는 그룹을 만들 수 있다 (created_by = 본인일 때만).
create policy groups_insert_self
  on public.groups for insert
  with check (created_by = auth.uid());

-- 관리자만 그룹 정보 수정.
create policy groups_update_admin
  on public.groups for update
  using (public.is_group_admin(id))
  with check (public.is_group_admin(id));

-- 관리자만 그룹 삭제 (실 운영에서는 archived 필드로 soft-delete 권장 — 추후).
create policy groups_delete_admin
  on public.groups for delete
  using (public.is_group_admin(id));

-- group_members RLS ---------------------------------------------------

alter table public.group_members enable row level security;

-- 같은 그룹 멤버 명단은 서로 본다.
create policy group_members_select_groupmate
  on public.group_members for select
  using (public.is_group_member(group_id));

-- 본인 가입(group_role = 'admin' 자동 트리거를 통한 첫 가입)은
-- handle_new_group 트리거가 SECURITY DEFINER 로 처리한다.
-- 그 외 일반 가입은 초대 시스템(M1.4)을 통해서만 — 지금은 INSERT 막아둔다.
create policy group_members_insert_admin
  on public.group_members for insert
  with check (public.is_group_admin(group_id));

-- 본인은 언제든 탈퇴 가능, 관리자는 강퇴 가능.
create policy group_members_delete_self_or_admin
  on public.group_members for delete
  using (user_id = auth.uid() or public.is_group_admin(group_id));

-- 역할 변경은 관리자만.
create policy group_members_update_admin
  on public.group_members for update
  using (public.is_group_admin(group_id))
  with check (public.is_group_admin(group_id));

-- =====================================================================
-- 권한 부여 — RLS 가 켜져 있어도 기본 GRANT 가 필요.
-- =====================================================================

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles      to authenticated;
grant select, insert, update, delete on public.groups        to authenticated;
grant select, insert, update, delete on public.group_members to authenticated;
