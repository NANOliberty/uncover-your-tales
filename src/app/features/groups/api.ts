import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type { GroupRow } from '../../lib/supabase/database.types';
import { useSession } from '../auth/useSession';

/**
 * RLS 가 "내가 멤버인 그룹만" 걸러주므로 클라이언트는 단순 select.
 * 로그인 안 된 상태면 쿼리 자체를 비활성화 — 비로그인 호출은 어차피 anon 권한이라 0행이 와도
 * cache pollution / 불필요한 호출을 막는다.
 */
const groupsKeys = {
  all: ['groups'] as const,
  mine: () => [...groupsKeys.all, 'mine'] as const,
  bySlug: (slug: string) => [...groupsKeys.all, 'bySlug', slug] as const,
};

export function useMyGroups() {
  const { user, isLoading: sessionLoading } = useSession();

  return useQuery({
    queryKey: groupsKeys.mine(),
    enabled: !!user && !sessionLoading,
    queryFn: async (): Promise<GroupRow[]> => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as GroupRow[];
    },
  });
}

export function useGroupBySlug(slug: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();

  return useQuery({
    queryKey: groupsKeys.bySlug(slug ?? ''),
    enabled: !!slug && !!user && !sessionLoading,
    queryFn: async (): Promise<GroupRow | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return (data as GroupRow | null) ?? null;
    },
  });
}

export const groupsQueryKeys = groupsKeys;
