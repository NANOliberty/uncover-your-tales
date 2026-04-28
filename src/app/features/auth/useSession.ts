import { useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';

const SESSION_KEY = ['auth', 'session'] as const;

/**
 * 현재 Supabase 세션 + Supabase 의 onAuthStateChange 를 React Query 캐시에 동기화한다.
 * 로그인/로그아웃이 일어나면 캐시가 갱신되어 useSession 을 쓰는 모든 컴포넌트가 리렌더링.
 */
export function useSession() {
  const qc = useQueryClient();

  const query = useQuery<Session | null>({
    queryKey: SESSION_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      qc.setQueryData<Session | null>(SESSION_KEY, session);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  return {
    session: query.data ?? null,
    user: (query.data?.user ?? null) as User | null,
    isLoading: query.isLoading,
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function signInWithDiscord(next?: string) {
  return supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: buildRedirect(next),
      scopes: 'identify email',
    },
  });
}

export async function signInWithGoogle(next?: string) {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: buildRedirect(next),
    },
  });
}

/**
 * 이메일 매직 링크 — OAuth 키가 없어도 로그인할 수 있는 경로.
 * 로컬에서는 Mailpit(http://127.0.0.1:54324) 이 메일을 잡아주므로
 * SMTP 설정 없이 즉시 사용 가능.
 */
export async function signInWithEmailMagicLink(email: string, next?: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: buildRedirect(next),
      shouldCreateUser: true,
    },
  });
}

/**
 * `redirectTo` 에 `?next=` 를 끼워 보내, 콜백 페이지가 로그인 후 원래 가려던 곳으로 돌려보낼 수 있게 한다.
 * 예: 비로그인 상태로 /groups/join?code=ABC 를 열면
 *  - RequireAuth 가 /auth/login 으로 보내며 state.from 에 위치 저장
 *  - 로그인 페이지가 next='/groups/join?code=ABC' 를 OAuth/매직링크 redirectTo 에 인코딩
 *  - 메일·OAuth 라운드트립 후 /auth/callback?next=...&access_token=... 로 도착
 *  - AuthCallbackPage 가 next 로 navigate
 */
function buildRedirect(next?: string): string | undefined {
  const base = redirectUrl();
  if (!base) return undefined;
  const safeNext = sanitizeNext(next);
  if (!safeNext || safeNext === '/') return base;
  return `${base}?next=${encodeURIComponent(safeNext)}`;
}

function redirectUrl() {
  const fromEnv = import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined;
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return `${window.location.origin}/auth/callback`;
  return undefined;
}

/**
 * Open redirect 방지 — 외부 URL 이나 protocol-relative 는 거부.
 * 외부에서도 (콜백 페이지의 ?next= 검증 등) 재사용.
 */
export function sanitizeNext(next: string | undefined | null): string | undefined {
  if (!next) return undefined;
  if (!next.startsWith('/') || next.startsWith('//')) return undefined;
  return next;
}
