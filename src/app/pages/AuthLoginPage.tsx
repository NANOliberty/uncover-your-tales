import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { signInWithDiscord, signInWithGoogle, useSession } from '../features/auth/useSession';

export function AuthLoginPage() {
  const { session, isLoading } = useSession();
  const location = useLocation();
  const [pending, setPending] = useState<'discord' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return null;
  }

  if (session) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  const handle = async (provider: 'discord' | 'google') => {
    setError(null);
    setPending(provider);
    try {
      const fn = provider === 'discord' ? signInWithDiscord : signInWithGoogle;
      const { error } = await fn();
      if (error) {
        setError(error.message);
        setPending(null);
      }
      // 성공 시 외부 OAuth 페이지로 리다이렉트되므로 더 할 일 없음.
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
      setPending(null);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <header className="text-center">
          <p className="text-sm text-muted-foreground">Uncover Your Tales</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">로그인</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            친구 그룹의 TRPG 아카이브에 들어가려면 로그인하세요.
          </p>
        </header>

        <div className="mt-8 space-y-3">
          <Button
            type="button"
            variant="default"
            className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
            disabled={pending !== null}
            onClick={() => handle('discord')}
          >
            {pending === 'discord' ? '디스코드로 이동 중…' : 'Discord 로 계속하기'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending !== null}
            onClick={() => handle('google')}
          >
            {pending === 'google' ? 'Google 로 이동 중…' : 'Google 로 계속하기'}
          </Button>
        </div>

        {error && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Discord 연동을 권장합니다 — 모집 마감 시 자동 멘션에 사용됩니다.
        </p>
      </div>
    </div>
  );
}
