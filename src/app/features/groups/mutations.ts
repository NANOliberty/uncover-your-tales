import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { groupsQueryKeys } from './api';
import type { GroupRow } from '../../lib/supabase/database.types';

interface CreateGroupInput {
  name: string;
  slug: string;
  description?: string | null;
}

/**
 * 그룹 생성.
 * - created_by 는 DB BEFORE INSERT 트리거가 auth.uid() 로 자동 세팅 (0003 마이그레이션)
 * - 그룹 생성 후 group_members 에 admin 으로 자동 등록 (0001 의 handle_new_group)
 */
export function useCreateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGroupInput): Promise<GroupRow> => {
      const { data, error } = await supabase
        .from('groups')
        // created_by 를 명시적으로 보내지 않는다 — 트리거가 채운다.
        .insert({
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as GroupRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupsQueryKeys.all });
    },
  });
}

/**
 * 초대 코드로 가입. RPC 가 모든 검증·중복 가입 체크를 수행하고
 * 성공 시 group_id 를 돌려준다.
 */
export function useRedeemInvite() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      const trimmed = code.trim().toUpperCase();
      const { data, error } = await supabase.rpc('redeem_invite', { p_code: trimmed });
      if (error) throw error;
      if (!data) throw new Error('REDEEM_FAILED');
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupsQueryKeys.all });
    },
  });
}

/**
 * 코드 미리보기 — RPC 호출. 가입 직전 "어느 그룹의 초대인지" 확인용.
 */
export async function peekInvite(code: string) {
  const { data, error } = await supabase.rpc('peek_invite', { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  return (data?.[0] ?? null) as {
    group_id: string;
    group_name: string;
    group_slug: string;
    default_role: 'admin' | 'member' | 'guest';
    expires_at: string | null;
    remaining_uses: number;
  } | null;
}

/**
 * 초대 발급 — 관리자 전용. 서버에서 코드 자동 생성 후 unique 충돌 시 재시도.
 */
export interface IssueInviteInput {
  groupId: string;
  createdBy: string;
  maxUses?: number;
  expiresAt?: Date | null;
  defaultRole?: 'member' | 'guest';
}

export function useIssueInvite() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: IssueInviteInput) => {
      // 충돌 시 재시도 (확률은 매우 낮음 — 32^6 ≈ 10억).
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: code, error: codeErr } = await supabase.rpc('generate_invite_code');
        if (codeErr) throw codeErr;
        if (!code) throw new Error('CODE_GEN_FAILED');

        const { data, error } = await supabase
          .from('group_invitations')
          .insert({
            group_id: input.groupId,
            code: code as string,
            created_by: input.createdBy,
            max_uses: input.maxUses ?? 1,
            expires_at: input.expiresAt ? input.expiresAt.toISOString() : null,
            default_role: input.defaultRole ?? 'member',
          })
          .select('*')
          .single();

        if (!error) return data;
        // unique 위반(23505) 은 재시도, 그 외는 throw.
        const code23505 = (error as { code?: string }).code;
        if (code23505 !== '23505') throw error;
      }
      throw new Error('CODE_COLLISION_RETRY_EXCEEDED');
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['groupInvitations', input.groupId] });
    },
  });
}
