import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type {
  SessionParticipantRow,
  SessionRunRow,
} from '../../lib/supabase/database.types';
import { useSession } from '../auth/useSession';

const sessionsKeys = {
  all: ['session_runs'] as const,
  byGroup: (groupId: string) => [...sessionsKeys.all, 'group', groupId] as const,
  one: (id: string) => [...sessionsKeys.all, 'one', id] as const,
  participants: (id: string) => [...sessionsKeys.all, 'participants', id] as const,
  byUser: (userId: string) => [...sessionsKeys.all, 'user', userId] as const,
  byCharacter: (characterId: string) => [...sessionsKeys.all, 'character', characterId] as const,
  byScenario: (scenarioId: string) => [...sessionsKeys.all, 'scenario', scenarioId] as const,
};

/** 그룹 내 세션 목록 (RLS 가 그룹 멤버만 통과). */
export function useGroupSessions(groupId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();
  return useQuery({
    queryKey: sessionsKeys.byGroup(groupId ?? ''),
    enabled: !!groupId && !!user && !sessionLoading,
    queryFn: async (): Promise<SessionRunRow[]> => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from('session_runs')
        .select('*')
        .eq('group_id', groupId)
        .order('scheduled_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SessionRunRow[];
    },
  });
}

export function useSessionRun(id: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();
  return useQuery({
    queryKey: sessionsKeys.one(id ?? ''),
    enabled: !!id && !!user && !sessionLoading,
    queryFn: async (): Promise<SessionRunRow | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('session_runs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as SessionRunRow | null) ?? null;
    },
  });
}

/** 세션 참여자 목록. profiles 와 join 해서 닉네임/아바타까지. */
export interface SessionParticipantWithProfile extends SessionParticipantRow {
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export function useSessionParticipants(sessionRunId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();
  return useQuery({
    queryKey: sessionsKeys.participants(sessionRunId ?? ''),
    enabled: !!sessionRunId && !!user && !sessionLoading,
    queryFn: async (): Promise<SessionParticipantWithProfile[]> => {
      if (!sessionRunId) return [];
      const { data, error } = await supabase
        .from('session_participants')
        .select('*, profile:profiles(display_name, avatar_url)')
        .eq('session_run_id', sessionRunId)
        .order('role', { ascending: true })  // gm 이 먼저
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SessionParticipantWithProfile[];
    },
  });
}

/** 어떤 캐릭터가 참여한 세션들 (캐릭터 디테일 '참여 세션' 섹션용) */
export function useSessionsByCharacter(characterId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();
  return useQuery({
    queryKey: sessionsKeys.byCharacter(characterId ?? ''),
    enabled: !!characterId && !!user && !sessionLoading,
    queryFn: async (): Promise<SessionRunRow[]> => {
      if (!characterId) return [];
      const { data, error } = await supabase
        .from('session_participants')
        .select('session_run_id, session_runs!inner(*)')
        .eq('character_id', characterId);
      if (error) throw error;
      // join 해서 가져온 session_runs 만 추출
      type Row = { session_runs: SessionRunRow };
      return ((data ?? []) as unknown as Row[]).map((r) => r.session_runs);
    },
  });
}

/** 어떤 시나리오로 굴려진 세션들 (시나리오 디테일 '굴린 세션' 섹션용) */
export function useSessionsByScenario(scenarioId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();
  return useQuery({
    queryKey: sessionsKeys.byScenario(scenarioId ?? ''),
    enabled: !!scenarioId && !!user && !sessionLoading,
    queryFn: async (): Promise<SessionRunRow[]> => {
      if (!scenarioId) return [];
      const { data, error } = await supabase
        .from('session_runs')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('scheduled_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as SessionRunRow[];
    },
  });
}

export const sessionsQueryKeys = sessionsKeys;
