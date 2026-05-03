-- =====================================================================
-- 0012: character_relations — 캐릭터 간 관계 (M6, 핵심 가치 #4)
--
-- 데이터 모델:
--  - directed (비대칭): A→B 신뢰 / B→A 이용 — 두 row 로 표현.
--  - 시점 (session_run_id):
--      null → "현재" (= 캠페인 종료 후 정착된 관계)
--      있음 → 그 SessionRun "당시"의 관계 (시점 토글로 보임)
--  - 자동 약한 연결은 별도 저장 X — session_participants 에서 derive.
--    (저장 안 하면 stale 안 됨 + 캐릭터 삭제 시 자동 사라짐)
--
-- 권한: 같은 group 멤버는 다 보고, 만든 사람만 수정/삭제.
-- =====================================================================

create type relation_kind as enum (
  'positive',  -- 애정·우정·동료
  'negative',  -- 적대·라이벌·증오
  'neutral',   -- 지인·중립
  'bond',      -- 가족·연인·맹세 (강한 연결)
  'mystery'    -- 수상함·의심·미지
);

create table public.character_relations (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references public.groups (id) on delete cascade,
  from_character_id uuid not null references public.characters (id) on delete cascade,
  to_character_id   uuid not null references public.characters (id) on delete cascade,
  -- null = "현재" 시점, 있으면 해당 SessionRun 시점에서의 관계
  session_run_id    uuid references public.session_runs (id) on delete set null,
  kind              relation_kind not null default 'neutral',
  label             text not null check (char_length(btrim(label)) between 1 and 50),
  note              text,
  created_by        uuid not null references auth.users (id) on delete restrict,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- 자기 자신을 가리키지 못함
  check (from_character_id <> to_character_id)
);

create index character_relations_group_idx   on public.character_relations (group_id);
create index character_relations_from_idx    on public.character_relations (from_character_id);
create index character_relations_to_idx      on public.character_relations (to_character_id);
create index character_relations_session_idx on public.character_relations (session_run_id);

create trigger character_relations_set_updated_at
  before update on public.character_relations
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.character_relations enable row level security;

create policy character_relations_select_member
  on public.character_relations for select
  using (public.is_group_member(group_id));

create policy character_relations_insert_member
  on public.character_relations for insert
  with check (
    created_by = auth.uid()
    and public.is_group_member(group_id)
  );

create policy character_relations_update_creator
  on public.character_relations for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy character_relations_delete_creator
  on public.character_relations for delete
  using (created_by = auth.uid());

grant select, insert, update, delete on public.character_relations to authenticated;
