import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type { CharacterRow } from '../../lib/supabase/database.types';
import { useSession } from '../auth/useSession';

const charactersKeys = {
  all: ['characters'] as const,
  byGroup: (groupId: string) => [...charactersKeys.all, 'group', groupId] as const,
  one: (id: string) => [...charactersKeys.all, 'one', id] as const,
};

/**
 * 그룹 내 캐릭터 목록. RLS 가 그룹 멤버만 통과시킴.
 */
export function useGroupCharacters(groupId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();

  return useQuery({
    queryKey: charactersKeys.byGroup(groupId ?? ''),
    enabled: !!groupId && !!user && !sessionLoading,
    queryFn: async (): Promise<CharacterRow[]> => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('group_id', groupId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CharacterRow[];
    },
  });
}

export function useCharacter(characterId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSession();

  return useQuery({
    queryKey: charactersKeys.one(characterId ?? ''),
    enabled: !!characterId && !!user && !sessionLoading,
    queryFn: async (): Promise<CharacterRow | null> => {
      if (!characterId) return null;
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .maybeSingle();
      if (error) throw error;
      return (data as CharacterRow | null) ?? null;
    },
  });
}

export const charactersQueryKeys = charactersKeys;
