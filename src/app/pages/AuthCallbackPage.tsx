import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase/client';
import { sanitizeNext } from '../features/auth/useSession';

/**
 * Supabase OAuth / 매직링크 콜백.
 *
 * Supabase JS 가 detectSessionInUrl: true 로 URL 의 token 을 알아서 처리한다.
 * 이 페이지는 그 직후 onAuthStateChange 가 발화하면 적절한 곳으로 보낸다.
 *
 * 라우팅 우선순위:
 *  1) URL 의 ?next= (로그인 페이지에서 redirectTo 에 인코딩한 원래 위치)
 *  2) /
 *
 * 안전망으로 5초 안에 세션이 안 잡히면 에러 표시.
 */
function readNext(): string {
  const params = new URLSearchParams(window.location.search);
  return sanitizeNext(params.get('next')) ?? '/';
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const target = readNext();

    // 즉시 한 번 — 이미 세션이 잡혔을 수 있음.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        navigate(target, { replace: true });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' && session) {
        navigate(target, { replace: true });
      }
    });

    const fallback = window.setTimeout(() => {
      if (cancelled) return;
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        if (!data.session) {
          setError('로그인 세션을 받지 못했습니다. 다시 시도해 주세요.');
        }
      });
    }, 5000);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.clearTimeout(fallback);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6">
      <p className="text-sm text-muted-foreground">로그인 처리 중…</p>
      {error && (
        <div className="max-w-sm rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => navigate('/auth/login', { replace: true })}
          >
            로그인 페이지로
          </button>
        </div>
      )}
    </div>
  );
}
