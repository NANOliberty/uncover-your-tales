import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type {
  CharacterRelationRow,
  RelationKind,
} from '../../lib/supabase/database.types';
import { relationsQueryKeys } from './api';

export interface CreateRelationInput {
  groupId: string;
  fromCharacterId: string;
  toCharacterId: string;
  /** null = "현재" 시점 / 있으면 SessionRun 시점 */
  sessionRunId?: string | null;
  kind: RelationKind;
  label: string;
  note?: string | null;
}

export function useCreateRelation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRelationInput): Promise<CharacterRelationRow> => {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const uid = userRes.user?.id;
      if (!uid) throw new Error('AUTH_REQUIRED');

      const { data, error } = await supabase
        .from('character_relations')
        .insert({
          group_id: input.groupId,
          from_character_id: input.fromCharacterId,
          to_character_id: input.toCharacterId,
          session_run_id: input.sessionRunId ?? null,
          kind: input.kind,
          label: input.label.trim(),
          note: input.note?.trim() || null,
          created_by: uid,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as CharacterRelationRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: relationsQueryKeys.byGroup(row.group_id) });
    },
  });
}

export function useUpdateRelation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      groupId: string;
      patch: Partial<{
        kind: RelationKind;
        label: string;
        note: string | null;
        session_run_id: string | null;
      }>;
    }): Promise<CharacterRelationRow> => {
      const { data, error } = await supabase
        .from('character_relations')
        .update(input.patch as never)
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw error;
      return data as CharacterRelationRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: relationsQueryKeys.byGroup(row.group_id) });
    },
  });
}

export function useDeleteRelation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; groupId: string }): Promise<void> => {
      const { error } = await supabase.from('character_relations').delete().eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: relationsQueryKeys.byGroup(input.groupId) });
    },
  });
}
