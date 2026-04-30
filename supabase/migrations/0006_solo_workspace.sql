-- =====================================================================
-- 0006: 개인 작업실 (solo group) 자동 생성
--
-- 모든 사용자에게 가입 시 1명짜리 개인 그룹 ("내 작업실") 을 자동 생성.
-- 솔로 캐릭터/시나리오 작업, 단발 세션 준비, 비공개 초안 보관에 사용.
-- 정기 그룹과 동일한 데이터 모델을 공유하므로 캐릭터·시나리오 이동이 자유롭다.
-- =====================================================================

-- (1) 컬럼 추가 -------------------------------------------------------
-- visibility 와 별개로 is_solo 플래그를 둔다.
-- 이유: 단발용 임시 공유 그룹(visibility=private 이지만 is_solo=false) 같은
-- 케이스를 미래에 자연스럽게 표현할 수 있게.
alter table public.groups
  add column is_solo boolean not null default false;

-- 사용자당 개인 작업실은 최대 1개.
create unique index groups_solo_per_user_idx
  on public.groups (created_by)
  where is_solo = true;

-- (2) 신규 사용자 트리거 갱신 -----------------------------------------
-- handle_new_user 가 profile 생성 + solo group 생성을 한 트랜잭션에서.
-- handle_new_group 트리거가 group_members(admin) 자동 등록 담당.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_slug text;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'preferred_username',
    split_part(new.email, '@', 1),
    'PL'
  );

  insert into public.profiles (id, display_name, avatar_url, discord_user_id, discord_username)
  values (
    new.id,
    v_display_name,
    new.raw_user_meta_data->>'avatar_url',
    case when new.raw_app_meta_data->>'provider' = 'discord'
         then new.raw_user_meta_data->>'provider_id' end,
    case when new.raw_app_meta_data->>'provider' = 'discord'
         then new.raw_user_meta_data->>'user_name' end
  );

  -- 개인 작업실 — slug 는 user uuid 의 앞 12 hex 로.
  -- (한국어 display_name 은 슬러그 정규식과 안 맞아서 안전한 prefix 사용)
  v_slug := 'solo-' || substr(replace(new.id::text, '-', ''), 1, 12);

  insert into public.groups (name, slug, visibility, is_solo, created_by)
  values (
    v_display_name || '의 작업실',
    v_slug,
    'private',
    true,
    new.id
  );
  -- handle_new_group 트리거가 group_members 에 admin 으로 자동 등록.

  return new;
end;
$$;

-- (3) 기존 사용자 백필 ------------------------------------------------
-- 이미 가입한 사용자에게도 작업실을 만들어준다.
-- handle_new_group 트리거가 모든 신규 row 에 대해 group_members 등록을 한다.
insert into public.groups (name, slug, visibility, is_solo, created_by)
select
  p.display_name || '의 작업실',
  'solo-' || substr(replace(p.id::text, '-', ''), 1, 12),
  'private',
  true,
  p.id
from public.profiles p
where not exists (
  select 1 from public.groups g
   where g.created_by = p.id
     and g.is_solo = true
);

-- (4) 슬러그 정규식과의 호환 ------------------------------------------
-- slug CHECK: ^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$
-- "solo-91bd5454be2d" = 17 chars: 's','o',...,'-','9',...,'d' → 첫·끝 영숫자, 길이 17 OK.
