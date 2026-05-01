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

/**
 * 내가 속한 그룹을 "내 작업실(solo)" 과 "공유 그룹(shared)" 로 분리해서 반환.
 * UI 가 거의 항상 둘을 다르게 표현하므로 메모이즈 한 번에 둘 다 꺼낼 수 있게.
 */
export function useGroupSplit() {
  const { data, ...rest } = useMyGroups();
  const personal = (data ?? []).find((g) => g.is_solo) ?? null;
  const shared = (data ?? []).filter((g) => !g.is_solo);
  return { personal, shared, ...rest };
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

/**
 * 현재 사용자의 그룹 내 역할. 멤버가 아니면 null.
 * RLS 가 다른 사람의 row 를 막아주지만, 명시적으로 user_id = auth.uid() 로 좁힌다.
 */
export function useMyMembership(groupId: string | undefined) {
  const { user } = useSession();
  return useQuery({
    queryKey: ['groupMembership', groupId, user?.id],
    enabled: !!groupId && !!user,
    queryFn: async () => {
      if (!groupId || !user) return null;
      const { data, error } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.role ?? null;
    },
  });
}

/**
 * 그룹 멤버 목록 + profile 정보 join.
 * 세션 참여자 추가 등에서 사용.
 */
export interface GroupMemberWithProfile {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'guest';
  joined_at: string;
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export function useGroupMembers(groupId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();
  return useQuery({
    queryKey: ['groupMembers', groupId],
    enabled: !!groupId && !!user && !sessionLoading,
    queryFn: async (): Promise<GroupMemberWithProfile[]> => {
      if (!groupId) return [];
      // 먼저 멤버 row.
      // (group_members.user_id 는 auth.users 에 FK 가 걸려있고, profiles 에는
      //  직접 FK 가 없어 PostgREST nested select 가 join 을 못 찾는다 →
      //  두 번 쿼리 후 클라이언트에서 합친다.)
      const { data: rows, error } = await supabase
        .from('group_members')
        .select('group_id, user_id, role, joined_at')
        .eq('group_id', groupId)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });
      if (error) throw error;
      const members = (rows ?? []) as Omit<GroupMemberWithProfile, 'profile'>[];
      if (members.length === 0) return [];

      const userIds = members.map((m) => m.user_id);
      const { data: profileRows, error: profileErr } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      if (profileErr) throw profileErr;

      const byId = new Map(
        ((profileRows ?? []) as { id: string; display_name: string; avatar_url: string | null }[]).map(
          (p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }],
        ),
      );
      return members.map((m) => ({ ...m, profile: byId.get(m.user_id) ?? null }));
    },
  });
}

export const groupsQueryKeys = groupsKeys;
