import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  signInWithDiscord,
  signInWithEmailMagicLink,
  signInWithGoogle,
  useSession,
} from '../features/auth/useSession';

export function AuthLoginPage() {
  const { session, isLoading } = useSession();
  const location = useLocation();
  const [pending, setPending] = useState<'discord' | 'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

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

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setPending('email');
    try {
      const { error } = await signInWithEmailMagicLink(email.trim());
      if (error) {
        setError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
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

        <div className="my-6 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          또는 이메일로
          <span className="h-px flex-1 bg-border" />
        </div>

        {magicLinkSent ? (
          <div className="rounded-md border border-emerald-300/40 bg-emerald-50 px-3 py-3 text-xs text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            <p className="font-medium">메일을 확인하세요</p>
            <p className="mt-1 leading-relaxed">
              {email} 으로 로그인 링크를 보냈습니다.
              <br />
              <span className="text-muted-foreground">
                로컬 개발 환경에서는 Mailpit(<a className="underline" href="http://127.0.0.1:54324" target="_blank" rel="noreferrer">http://127.0.0.1:54324</a>)에서 메일을 확인할 수 있습니다.
              </span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmail} className="space-y-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending !== null}
              required
            />
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={pending !== null || !email.trim()}
            >
              {pending === 'email' ? '보내는 중…' : '로그인 링크 받기'}
            </Button>
          </form>
        )}

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
