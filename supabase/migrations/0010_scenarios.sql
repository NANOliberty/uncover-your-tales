-- =====================================================================
-- 0010: scenarios — 시나리오 (불변 자산)
--
-- 명세 핵심:
--  - Scenario(불변 자산) 와 SessionRun(실제 굴려진 세션) 분리.
--  - 같은 시나리오를 여러 번 굴려도 시나리오는 하나, 세션은 여러 개.
--  - 작가, 소개, 핸드아웃, 추천 인원, 시스템, 트리거 워닝, 평점·후기.
--  - GM 전용 비공개 영역(스포일러·NPC 스탯·분기) — 등록자만 볼 수 있게.
-- =====================================================================

create table public.scenarios (
  id            uuid        primary key default gen_random_uuid(),
  group_id      uuid        not null references public.groups (id) on delete cascade,
  owner_id      uuid        not null references auth.users (id)   on delete cascade,
  system        trpg_system not null,
  title         text        not null check (char_length(btrim(title)) between 1 and 200),
  -- 시나리오 작가 (외부 작가 자유 입력 — '하루모토 케이고' 등)
  author        text,
  description   text,
  -- 가변 텍스트 영역들 (자유 형식)
  recommended_players text,    -- "3-5명"
  expected_play_time  text,    -- "3-4시간"
  difficulty          text,    -- "입문 / 중급 / 고난도"
  -- 태그
  genre_tags          text[] not null default '{}',
  trigger_warnings    text[] not null default '{}',
  -- 자료
  handout             text,
  bgm_recommendation  text,
  cover_url           text,    -- 표지 이미지 (covers 버킷, 추후 도입 시)
  -- GM 전용 (스포일러·NPC 스탯·분기·KP 메모) — 응답 시 등록자에게만 노출
  gm_only             jsonb not null default '{}'::jsonb,
  -- 시스템별 가변 영역
  data                jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index scenarios_group_idx     on public.scenarios (group_id);
create index scenarios_owner_idx     on public.scenarios (owner_id);
create index scenarios_system_idx    on public.scenarios (group_id, system);
create index scenarios_title_search  on public.scenarios using gin (to_tsvector('simple', title));

create trigger scenarios_set_updated_at
  before update on public.scenarios
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.scenarios enable row level security;

-- 같은 그룹 멤버는 SELECT (단 gm_only 컬럼은 응용 계층에서 마스킹).
create policy scenarios_select_member
  on public.scenarios for select
  using (public.is_group_member(group_id));

-- 직접 INSERT 차단 — RPC 만 사용. 단, 정책 자체는 owner = auth.uid() 허용.
create policy scenarios_insert_member
  on public.scenarios for insert
  with check (public.is_group_member(group_id) and owner_id = auth.uid());

-- 등록자만 수정/삭제.
create policy scenarios_update_owner
  on public.scenarios for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy scenarios_delete_owner
  on public.scenarios for delete
  using (owner_id = auth.uid());

grant select, insert, update, delete on public.scenarios to authenticated;

-- =====================================================================
-- 등록 RPC — 그룹 멤버십 검증 + owner 자동 세팅
-- =====================================================================

create or replace function public.create_scenario_rpc(
  p_group_id              uuid,
  p_system                trpg_system,
  p_title                 text,
  p_author                text default null,
  p_description           text default null,
  p_recommended_players   text default null,
  p_expected_play_time    text default null,
  p_difficulty            text default null,
  p_genre_tags            text[] default '{}',
  p_trigger_warnings      text[] default '{}',
  p_handout               text default null,
  p_bgm_recommendation    text default null,
  p_gm_only               jsonb default '{}'::jsonb,
  p_data                  jsonb default '{}'::jsonb
)
returns public.scenarios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.scenarios;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.group_members
     where group_id = p_group_id and user_id = v_uid
  ) then
    raise exception 'NOT_GROUP_MEMBER' using errcode = '42501';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'TITLE_REQUIRED' using errcode = '23514';
  end if;

  insert into public.scenarios (
    group_id, owner_id, system, title, author, description,
    recommended_players, expected_play_time, difficulty,
    genre_tags, trigger_warnings, handout, bgm_recommendation,
    gm_only, data
  ) values (
    p_group_id, v_uid, p_system, btrim(p_title),
    nullif(btrim(coalesce(p_author, '')), ''),
    nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_recommended_players, '')), ''),
    nullif(btrim(coalesce(p_expected_play_time, '')), ''),
    nullif(btrim(coalesce(p_difficulty, '')), ''),
    coalesce(p_genre_tags, '{}'),
    coalesce(p_trigger_warnings, '{}'),
    nullif(btrim(coalesce(p_handout, '')), ''),
    nullif(btrim(coalesce(p_bgm_recommendation, '')), ''),
    coalesce(p_gm_only, '{}'::jsonb),
    coalesce(p_data, '{}'::jsonb)
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.create_scenario_rpc(
  uuid, trpg_system, text, text, text, text, text, text, text[], text[], text, text, jsonb, jsonb
) to authenticated;
