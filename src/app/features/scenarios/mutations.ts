import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type { ScenarioRow, TrpgSystem } from '../../lib/supabase/database.types';
import { scenariosQueryKeys } from './api';

export interface CreateScenarioInput {
  groupId: string;
  system: TrpgSystem;
  title: string;
  author?: string | null;
  description?: string | null;
  recommendedPlayers?: string | null;
  expectedPlayTime?: string | null;
  difficulty?: string | null;
  genreTags?: string[];
  triggerWarnings?: string[];
  handout?: string | null;
  bgmRecommendation?: string | null;
  gmOnly?: Record<string, unknown>;
}

export function useCreateScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateScenarioInput): Promise<ScenarioRow> => {
      const { data, error } = await supabase.rpc('create_scenario_rpc', {
        p_group_id: input.groupId,
        p_system: input.system,
        p_title: input.title,
        p_author: input.author ?? null,
        p_description: input.description ?? null,
        p_recommended_players: input.recommendedPlayers ?? null,
        p_expected_play_time: input.expectedPlayTime ?? null,
        p_difficulty: input.difficulty ?? null,
        p_genre_tags: input.genreTags ?? [],
        p_trigger_warnings: input.triggerWarnings ?? [],
        p_handout: input.handout ?? null,
        p_bgm_recommendation: input.bgmRecommendation ?? null,
        p_gm_only: (input.gmOnly ?? {}) as never,
      });
      if (error) throw error;
      if (!data) throw new Error('CREATE_SCENARIO_RETURNED_EMPTY');
      return data as ScenarioRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: scenariosQueryKeys.byGroup(row.group_id) });
    },
  });
}

export function useUpdateScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Partial<ScenarioRow>;
    }): Promise<ScenarioRow> => {
      const { data, error } = await supabase
        .from('scenarios')
        .update(input.patch as never)
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw error;
      return data as ScenarioRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: scenariosQueryKeys.one(row.id) });
      qc.invalidateQueries({ queryKey: scenariosQueryKeys.byGroup(row.group_id) });
    },
  });
}

export function useDeleteScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('scenarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: scenariosQueryKeys.all });
      qc.removeQueries({ queryKey: scenariosQueryKeys.one(id) });
    },
  });
}
