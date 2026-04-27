import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type { GroupInvitationRow } from '../../lib/supabase/database.types';

/**
 * 그룹 활성 초대 목록 (회수되지 않고 만료/소진되지 않은 것).
 * select 자체는 RLS 가 그룹 멤버에게 모두 허용 — 비활성 정책은 클라이언트 필터.
 */
export function useActiveInvites(groupId: string | undefined) {
  return useQuery({
    queryKey: ['groupInvitations', groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<GroupInvitationRow[]> => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('group_id', groupId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as GroupInvitationRow[]).filter(
        (i) => i.uses < i.max_uses && (!i.expires_at || new Date(i.expires_at) > new Date()),
      );
    },
  });
}
