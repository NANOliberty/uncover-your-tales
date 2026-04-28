-- =====================================================================
-- 0005: create_group RPC
--
-- RLS WITH CHECK + 클라이언트가 created_by 를 자칭하는 패턴이 (CLI 키 시스템 변경 등으로)
-- 미묘하게 어긋나는 케이스가 있어, 그룹 생성을 단일 SECURITY DEFINER RPC 로 통일.
-- 이 패턴은 redeem_invite 등 기존 RPC 들과 동일하며 검증·트리거를 한 곳에서 처리.
-- =====================================================================

create or replace function public.create_group_rpc(
  p_name        text,
  p_slug        text,
  p_description text default null
)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_group public.groups;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED: 로그인 세션이 인식되지 않습니다'
      using errcode = '42501';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'NAME_REQUIRED' using errcode = '23514';
  end if;

  if p_slug is null or btrim(p_slug) = '' then
    raise exception 'SLUG_REQUIRED' using errcode = '23514';
  end if;

  insert into public.groups (name, slug, description, created_by)
  values (
    btrim(p_name),
    btrim(p_slug),
    nullif(btrim(coalesce(p_description, '')), ''),
    v_uid
  )
  returning * into v_group;

  -- handle_new_group 트리거가 group_members 에 admin 으로 등록.
  return v_group;
end;
$$;

grant execute on function public.create_group_rpc(text, text, text) to authenticated;
