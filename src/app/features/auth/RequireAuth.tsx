import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from './useSession';

/**
 * 자식 라우트를 인증 사용자에게만 노출.
 * 로그인 안 했으면 /auth/login 으로 보내고, redirect 후 원래 페이지로 복귀할 수 있게
 * `from` 을 location state 로 전달.
 *
 * 세션 첫 로드 동안에는 빈 박스만 표시 (깜빡임 방지) — 인증 가드가 깜빡이면
 * `<Navigate>` 로 잠깐 빠져나갔다가 돌아오는 잡음이 생긴다.
 */
export function RequireAuth() {
  const { session, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        세션 확인 중…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
