import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type { ScenarioRow } from '../../lib/supabase/database.types';
import { useSession } from '../auth/useSession';

const scenariosKeys = {
  all: ['scenarios'] as const,
  byGroup: (groupId: string) => [...scenariosKeys.all, 'group', groupId] as const,
  one: (id: string) => [...scenariosKeys.all, 'one', id] as const,
};

export function useGroupScenarios(groupId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();
  return useQuery({
    queryKey: scenariosKeys.byGroup(groupId ?? ''),
    enabled: !!groupId && !!user && !sessionLoading,
    queryFn: async (): Promise<ScenarioRow[]> => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('group_id', groupId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ScenarioRow[];
    },
  });
}

export function useScenario(scenarioId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();
  return useQuery({
    queryKey: scenariosKeys.one(scenarioId ?? ''),
    enabled: !!scenarioId && !!user && !sessionLoading,
    queryFn: async (): Promise<ScenarioRow | null> => {
      if (!scenarioId) return null;
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .maybeSingle();
      if (error) throw error;
      return (data as ScenarioRow | null) ?? null;
    },
  });
}

export const scenariosQueryKeys = scenariosKeys;
