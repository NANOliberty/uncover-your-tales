import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type {
  CharacterRelationRow,
  SessionParticipantRow,
} from '../../lib/supabase/database.types';
import { useSession } from '../auth/useSession';

const relationsKeys = {
  all: ['character_relations'] as const,
  byGroup: (groupId: string) => [...relationsKeys.all, 'group', groupId] as const,
};

const autoLinksKeys = {
  byGroup: (groupId: string) => ['auto_relations', 'group', groupId] as const,
};

/** 그룹 내 모든 수동 관계. RLS 가 그룹 멤버만 통과시킴. */
export function useGroupRelations(groupId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();
  return useQuery({
    queryKey: relationsKeys.byGroup(groupId ?? ''),
    enabled: !!groupId && !!user && !sessionLoading,
    queryFn: async (): Promise<CharacterRelationRow[]> => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from('character_relations')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CharacterRelationRow[];
    },
  });
}

/**
 * 자동 약한 연결 — 같은 SessionRun 에 함께 참여한 캐릭터 쌍.
 *
 * (group 내 session_runs 의 participants 를 모두 끌어와 클라이언트에서 pair 생성.)
 * 그룹 단위라 행 수가 많아질 일이 거의 없고 (보통 캐릭터 수십 명 수준), join 한 번으로 끝남.
 */
export interface AutoLink {
  fromCharacterId: string;
  toCharacterId: string;
  sessionRunIds: string[]; // 함께 참여한 모든 세션
}

export function useAutoLinks(groupId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();
  return useQuery({
    queryKey: autoLinksKeys.byGroup(groupId ?? ''),
    enabled: !!groupId && !!user && !sessionLoading,
    queryFn: async (): Promise<AutoLink[]> => {
      if (!groupId) return [];
      // 그룹 내 모든 SessionRun.id 먼저
      const { data: runs, error: runErr } = await supabase
        .from('session_runs')
        .select('id')
        .eq('group_id', groupId);
      if (runErr) throw runErr;
      const runIds = (runs ?? []).map((r) => r.id as string);
      if (runIds.length === 0) return [];

      // 그 세션들의 모든 participants (character_id 가 있는 것만)
      const { data: parts, error: partsErr } = await supabase
        .from('session_participants')
        .select('session_run_id, character_id')
        .in('session_run_id', runIds)
        .not('character_id', 'is', null);
      if (partsErr) throw partsErr;
      const rows = (parts ?? []) as Pick<SessionParticipantRow, 'session_run_id' | 'character_id'>[];

      // session_run_id 별로 character_id 묶기
      const bySession = new Map<string, string[]>();
      for (const r of rows) {
        if (!r.character_id) continue;
        const arr = bySession.get(r.session_run_id) ?? [];
        arr.push(r.character_id);
        bySession.set(r.session_run_id, arr);
      }

      // 각 세션 안의 모든 (character_id) 쌍 생성, undirected → fromId < toId 로 정규화
      const linkMap = new Map<string, AutoLink>();
      for (const [sessionId, charIds] of bySession) {
        const unique = Array.from(new Set(charIds));
        for (let i = 0; i < unique.length; i++) {
          for (let j = i + 1; j < unique.length; j++) {
            const [a, b] = [unique[i], unique[j]].sort();
            const key = `${a}::${b}`;
            const prev = linkMap.get(key);
            if (prev) {
              prev.sessionRunIds.push(sessionId);
            } else {
              linkMap.set(key, {
                fromCharacterId: a,
                toCharacterId: b,
                sessionRunIds: [sessionId],
              });
            }
          }
        }
      }
      return Array.from(linkMap.values());
    },
  });
}

export const relationsQueryKeys = relationsKeys;
export const autoLinksQueryKeys = autoLinksKeys;
