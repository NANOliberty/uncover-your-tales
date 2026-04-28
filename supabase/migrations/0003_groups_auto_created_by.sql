-- =====================================================================
-- 0003: groups.created_by 를 trigger 로 자동 세팅
--
-- 클라이언트가 created_by 를 넘기는 패턴은:
--  (a) RLS WITH CHECK 와 클라이언트 값이 어긋나면 디버깅이 어렵고
--  (b) 신뢰 경계 측면에서도 클라이언트 자칭값을 받지 않는 게 맞다.
-- BEFORE INSERT 트리거에서 auth.uid() 로 직접 채우고,
-- 만약 auth.uid() 가 null 이면 clear error 로 알려준다.
-- =====================================================================

create or replace function public.set_groups_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED: auth.uid() is null — JWT 가 없거나 무효입니다'
      using errcode = '42501';
  end if;
  -- 클라이언트가 created_by 를 비워서 보내든, 다른 값으로 보내든
  -- 무조건 인증된 사용자 본인으로 덮어쓴다.
  new.created_by := auth.uid();
  return new;
end;
$$;

create trigger groups_set_created_by
  before insert on public.groups
  for each row execute function public.set_groups_created_by();

-- created_by 컬럼은 NOT NULL 인데 클라이언트가 안 넘기면
-- 트리거 실행 전에 NOT NULL 위반이 발생할 수 있어 default 도 설정.
-- (PostgreSQL 은 BEFORE 트리거를 NOT NULL 체크보다 먼저 돌리지만, 안전 차원)
alter table public.groups
  alter column created_by set default auth.uid();
