import { useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';

const SESSION_KEY = ['auth', 'session'] as const;

/**
 * 현재 Supabase 세션 + Supabase 의 onAuthStateChange 를 React Query 캐시에 동기화한다.
 * 로그인/로그아웃이 일어나면 캐시가 갱신되어 useSession 을 쓰는 모든 컴포넌트가 리렌더링.
 *
 * - 마운트되지 않은 동안 일어난 변경(예: 다른 탭 로그인) 도
 *   onAuthStateChange 콜백이 처리해준다.
 * - getSession() 은 첫 호출 비용이 약간 있어 React Query 의 staleTime 으로 보호.
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

export async function signInWithDiscord() {
  return supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: redirectUrl(),
      scopes: 'identify email',
    },
  });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl(),
    },
  });
}

/**
 * 이메일 매직 링크 — OAuth 키가 없어도 로그인할 수 있는 경로.
 * 로컬에서는 Mailpit(http://127.0.0.1:54324) 이 메일을 잡아주므로
 * SMTP 설정 없이 즉시 사용 가능.
 */
export async function signInWithEmailMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl(),
      shouldCreateUser: true,
    },
  });
}

function redirectUrl() {
  const fromEnv = import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined;
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return `${window.location.origin}/auth/callback`;
  return undefined;
}
