import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type {
  SessionParticipantRow,
  SessionRole,
  SessionRunRow,
  SessionStatus,
} from '../../lib/supabase/database.types';
import { sessionsQueryKeys } from './api';

export interface CreateSessionRunInput {
  groupId: string | null;
  scenarioId?: string | null;
  title?: string | null;
  scheduledAt?: string | null;
}

export function useCreateSessionRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSessionRunInput): Promise<SessionRunRow> => {
      const { data, error } = await supabase.rpc('create_session_run_rpc', {
        p_group_id: input.groupId,
        p_scenario_id: input.scenarioId ?? null,
        p_title: input.title ?? null,
        p_scheduled_at: input.scheduledAt ?? null,
      });
      if (error) throw error;
      if (!data) throw new Error('CREATE_SESSION_RETURNED_EMPTY');
      return data as SessionRunRow;
    },
    onSuccess: (row) => {
      if (row.group_id) {
        qc.invalidateQueries({ queryKey: sessionsQueryKeys.byGroup(row.group_id) });
      }
      qc.invalidateQueries({ queryKey: sessionsQueryKeys.all });
    },
  });
}

export function useUpdateSessionRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Partial<{
        title: string;
        status: SessionStatus;
        scheduled_at: string | null;
        started_at: string | null;
        ended_at: string | null;
        notes: string | null;
        scenario_id: string | null;
      }>;
    }): Promise<SessionRunRow> => {
      const { data, error } = await supabase
        .from('session_runs')
        .update(input.patch as never)
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw error;
      return data as SessionRunRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: sessionsQueryKeys.one(row.id) });
      if (row.group_id) {
        qc.invalidateQueries({ queryKey: sessionsQueryKeys.byGroup(row.group_id) });
      }
    },
  });
}

export function useDeleteSessionRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('session_runs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: sessionsQueryKeys.all });
      qc.removeQueries({ queryKey: sessionsQueryKeys.one(id) });
    },
  });
}

/** 참여자 추가. RLS: 세션 등록자 또는 본인. */
export function useAddParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sessionRunId: string;
      userId: string;
      role: SessionRole;
      characterId?: string | null;
    }): Promise<SessionParticipantRow> => {
      const { data, error } = await supabase
        .from('session_participants')
        .insert({
          session_run_id: input.sessionRunId,
          user_id: input.userId,
          role: input.role,
          character_id: input.characterId ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as SessionParticipantRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: sessionsQueryKeys.participants(row.session_run_id) });
    },
  });
}

export function useUpdateParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sessionRunId: string;
      userId: string;
      patch: Partial<{ role: SessionRole; character_id: string | null }>;
    }): Promise<SessionParticipantRow> => {
      const { data, error } = await supabase
        .from('session_participants')
        .update(input.patch as never)
        .eq('session_run_id', input.sessionRunId)
        .eq('user_id', input.userId)
        .select('*')
        .single();
      if (error) throw error;
      return data as SessionParticipantRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: sessionsQueryKeys.participants(row.session_run_id) });
    },
  });
}

export function useRemoveParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sessionRunId: string; userId: string }): Promise<void> => {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_run_id', input.sessionRunId)
        .eq('user_id', input.userId);
      if (error) throw error;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: sessionsQueryKeys.participants(input.sessionRunId) });
    },
  });
}
