import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useDeleteCharacter } from './mutations';

interface Props {
  characterId: string;
  characterName: string;
  /** 삭제 후 돌아갈 경로 — 보통 '/g/:slug/characters' */
  redirectTo: string;
}

/**
 * 캐릭터 삭제 다이얼로그.
 * - 사용자가 캐릭터 이름을 정확히 타이핑해야 활성화 (실수 방지)
 * - 성공 시 갤러리로 redirect
 */
export function DeleteCharacterDialog({ characterId, characterName, redirectTo }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const del = useDeleteCharacter();
  const navigate = useNavigate();

  const canDelete = confirmText.trim() === characterName.trim() && !del.isPending;

  const onDelete = async () => {
    if (!canDelete) return;
    try {
      await del.mutateAsync(characterId);
      toast.success(`"${characterName}" 삭제됨`);
      setOpen(false);
      navigate(redirectTo, { replace: true });
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`삭제 실패: ${msg}`);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setConfirmText('');
      }}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2 className="mr-1 h-4 w-4" />
          캐릭터 삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{characterName}</span> 의 모든 데이터(능력치·기능·무기·백스토리·일러스트)가 영구 삭제됩니다.
            세션 기록과의 연결도 끊어집니다. <strong>되돌릴 수 없습니다.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            확인을 위해 캐릭터 이름{' '}
            <span className="rounded bg-muted px-1 py-0.5 font-medium text-foreground">
              {characterName}
            </span>{' '}
            을 정확히 입력하세요.
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={characterName}
            autoFocus
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canDelete}
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {del.isPending ? '삭제 중…' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
