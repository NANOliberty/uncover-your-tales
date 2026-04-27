import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase/client';

/**
 * Supabase OAuth 콜백.
 *
 * Supabase JS 가 detectSessionInUrl: true 로 설정되어 있어 URL 의 access_token /
 * code 를 알아서 처리한다. 이 페이지는 그 직후 onAuthStateChange 가 발화하면
 * 홈으로 보내고, 실패 시 에러를 표시한다.
 *
 * 안전망으로 5초 안에 세션이 안 잡히면 로그인 페이지로 복귀.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // 즉시 한 번 — 이미 세션이 잡혔을 수 있음.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        navigate('/', { replace: true });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' && session) {
        navigate('/', { replace: true });
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
