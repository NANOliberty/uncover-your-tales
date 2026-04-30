import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type { CharacterRow, TrpgSystem } from '../../lib/supabase/database.types';
import { charactersQueryKeys } from './api';

export interface CreateCharacterInput {
  groupId: string;
  system: TrpgSystem;
  name: string;
  occupation?: string | null;
  data?: Record<string, unknown>;
}

/**
 * 그룹 멤버십 검증과 owner 자동 세팅을 RPC 가 한 번에.
 * groups 처럼 직접 INSERT 도 RLS 가 허용하지만, 그룹 외부 사용자가
 * 잘못된 group_id 로 만들려고 하면 RLS 거절 메시지가 RPC 보다 불친절해서 RPC 로 통일.
 */
export function useCreateCharacter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCharacterInput): Promise<CharacterRow> => {
      const { data, error } = await supabase.rpc('create_character_rpc', {
        p_group_id: input.groupId,
        p_system: input.system,
        p_name: input.name,
        p_occupation: input.occupation ?? null,
        // RPC 는 Json 으로 받는다 — Record 도 그대로 직렬화됨
        p_data: (input.data ?? {}) as never,
      });
      if (error) throw error;
      if (!data) throw new Error('CREATE_CHARACTER_RETURNED_EMPTY');
      return data as CharacterRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: charactersQueryKeys.byGroup(row.group_id) });
    },
  });
}

/**
 * 캐릭터 삭제. RLS 가 owner 만 허용. 되돌릴 수 없음.
 * portrait Storage 파일은 별도 정리 필요(추후) — 지금은 row 만 제거.
 */
export function useDeleteCharacter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('characters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: charactersQueryKeys.all });
      qc.removeQueries({ queryKey: charactersQueryKeys.one(id) });
    },
  });
}

/**
 * 캐릭터 부분 수정. owner 만 수정 가능 (RLS).
 * data jsonb 는 항상 통째로 덮어씀 — 부분 머지가 필요하면 별도 RPC 도입.
 */
export function useUpdateCharacter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Partial<{
        name: string;
        occupation: string | null;
        status: 'active' | 'retired' | 'dead';
        portrait_url: string | null;
        data: Record<string, unknown>;
      }>;
    }): Promise<CharacterRow> => {
      const { data, error } = await supabase
        .from('characters')
        .update(input.patch as never)
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw error;
      return data as CharacterRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: charactersQueryKeys.one(row.id) });
      qc.invalidateQueries({ queryKey: charactersQueryKeys.byGroup(row.group_id) });
    },
  });
}
