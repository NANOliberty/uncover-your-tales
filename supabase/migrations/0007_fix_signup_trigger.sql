-- =====================================================================
-- 0007: 가입 시 작업실 자동 생성이 0003 트리거와 충돌하는 문제 수정
--
-- 증상: 신규 매직링크 가입 시 "Database error saving new user".
-- 원인: handle_new_user 가 solo group 을 INSERT 할 때, 0003 의 BEFORE INSERT 트리거
--   set_groups_created_by 가 auth.uid() 가 null 이라며 거절.
--   가입 시점엔 사용자가 아직 세션을 안 가졌으므로 auth.uid() 는 null 이 정상.
-- 수정: 외부(인증된 클라이언트) 컨텍스트에서는 auth.uid() 로 덮어쓰고,
--   내부(트리거 안에서 호출자가 created_by 를 명시적으로 채운 경우) 는 신뢰.
-- =====================================================================

create or replace function public.set_groups_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    -- 외부 호출(클라이언트 RPC / 직접 INSERT). 보안상 클라 자칭값을 무시하고 덮어쓴다.
    new.created_by := auth.uid();
  elsif new.created_by is null then
    -- 내부 호출인데도 호출자가 created_by 를 안 넣은 케이스 — 명백한 버그.
    raise exception 'AUTH_REQUIRED: auth.uid() 가 null 이고 created_by 도 비어있습니다'
      using errcode = '42501';
  end if;
  -- auth.uid() is null & new.created_by 가 채워져 있음
  --  → handle_new_user 같은 시스템 트리거 컨텍스트. 그대로 진행.
  return new;
end;
$$;
