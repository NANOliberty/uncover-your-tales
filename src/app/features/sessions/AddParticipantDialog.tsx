import { useState } from 'react';
import { Search, User, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useGroupMembers } from '../groups/api';
import { useAddParticipant } from './mutations';
import type { SessionParticipantWithProfile } from './api';

interface Props {
  sessionRunId: string;
  groupId: string | null;
  currentParticipants: SessionParticipantWithProfile[];
  /** 트리거 자식 — 보통 '추가' 버튼 */
  trigger: React.ReactNode;
}

/**
 * 참여자 추가 다이얼로그. 그룹 멤버 중 아직 미참여인 사람을 검색·선택해
 * PL 또는 게스트로 추가.
 *
 * 그룹 외부의 사용자(트위터 일회성 등)는 M3.3 단발 페이지에서 별도 처리 — 여기선 그룹 멤버 한정.
 */
export function AddParticipantDialog({
  sessionRunId,
  groupId,
  currentParticipants,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: members = [], isLoading } = useGroupMembers(groupId ?? undefined);
  const add = useAddParticipant();

  const currentUserIds = new Set(currentParticipants.map((p) => p.user_id));
  const q = search.trim().toLowerCase();
  const available = members.filter((m) => {
    if (currentUserIds.has(m.user_id)) return false;
    if (!q) return true;
    return (m.profile?.display_name ?? '').toLowerCase().includes(q);
  });

  const handleAdd = async (userId: string, role: 'player' | 'guest') => {
    try {
      await add.mutateAsync({
        sessionRunId,
        userId,
        role,
        characterId: null,
      });
      toast.success('참여자가 추가되었어요');
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`추가 실패: ${msg}`);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch('');
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-md flex-col">
        <DialogHeader>
          <DialogTitle>참여자 추가</DialogTitle>
          <DialogDescription>
            그룹 멤버 중에서 선택해 PL 또는 게스트로 추가합니다.
          </DialogDescription>
        </DialogHeader>

        {!groupId ? (
          <p className="rounded-md border border-dashed bg-card px-3 py-3 text-center text-sm text-muted-foreground">
            그룹 외부 단발 세션은 다음 라운드(M3.3)에서 지원합니다.
          </p>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름으로 검색"
                className="pl-8"
                autoFocus
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
              {isLoading ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  멤버 목록 불러오는 중…
                </p>
              ) : available.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {currentUserIds.size === members.length
                    ? '모든 그룹 멤버가 이미 참여 중입니다.'
                    : '검색 결과가 없습니다.'}
                </p>
              ) : (
                <ul className="divide-y">
                  {available.map((m) => (
                    <li
                      key={m.user_id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      {m.profile?.avatar_url ? (
                        <img
                          src={m.profile.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full border object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <span className="flex-1 text-sm font-medium">
                        {m.profile?.display_name ?? '(이름 없음)'}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        disabled={add.isPending}
                        onClick={() => handleAdd(m.user_id, 'player')}
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        PL
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={add.isPending}
                        onClick={() => handleAdd(m.user_id, 'guest')}
                      >
                        게스트
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
