-- =====================================================================
-- 0004: whoami() — 진단용 RPC
--
-- 클라이언트가 PostgREST 에 요청을 보낼 때 JWT 가 제대로 부착되는지,
-- auth.uid() 가 어떤 값을 받는지를 즉시 확인할 수 있게 한다.
-- 운영에서도 두고 안전하다 (자기 자신의 정보만 반환).
-- =====================================================================

create or replace function public.whoami()
returns jsonb
language sql
stable
security invoker
as $$
  select jsonb_build_object(
    'auth_uid', auth.uid(),
    'role',     auth.role(),
    'jwt_present', auth.jwt() is not null
  );
$$;

grant execute on function public.whoami() to anon, authenticated;
