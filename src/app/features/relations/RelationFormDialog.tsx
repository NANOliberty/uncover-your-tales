import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import type {
  CharacterRelationRow,
  CharacterRow,
  RelationKind,
  SessionRunRow,
} from '../../lib/supabase/database.types';
import { useCreateRelation, useDeleteRelation, useUpdateRelation } from './mutations';
import {
  COMMON_LABELS_BY_KIND,
  RELATION_KINDS,
  RELATION_STYLES,
} from './relation-style';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  characters: CharacterRow[];
  sessions: SessionRunRow[];
  /** 편집 모드면 기존 row, 신규면 null */
  existing: CharacterRelationRow | null;
  /** 신규 생성 시 미리 채울 값 (그래프에서 노드 선택 후 추가 등) */
  defaultFromId?: string | null;
  defaultToId?: string | null;
  defaultSessionId?: string | null;
}

export function RelationFormDialog({
  open,
  onOpenChange,
  groupId,
  characters,
  sessions,
  existing,
  defaultFromId,
  defaultToId,
  defaultSessionId,
}: Props) {
  const isEdit = !!existing;
  const labelListId = useId();

  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [kind, setKind] = useState<RelationKind>('neutral');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [sessionId, setSessionId] = useState<string>('current');

  const create = useCreateRelation();
  const update = useUpdateRelation();
  const del = useDeleteRelation();

  // 다이얼로그 열릴 때 초기값 세팅
  useEffect(() => {
    if (!open) return;
    if (existing) {
      setFromId(existing.from_character_id);
      setToId(existing.to_character_id);
      setKind(existing.kind);
      setLabel(existing.label);
      setNote(existing.note ?? '');
      setSessionId(existing.session_run_id ?? 'current');
    } else {
      setFromId(defaultFromId ?? '');
      setToId(defaultToId ?? '');
      setKind('neutral');
      setLabel('');
      setNote('');
      setSessionId(defaultSessionId ?? 'current');
    }
  }, [open, existing, defaultFromId, defaultToId, defaultSessionId]);

  const labelSuggestions = useMemo(() => COMMON_LABELS_BY_KIND[kind], [kind]);

  const canSubmit =
    fromId !== '' && toId !== '' && fromId !== toId && label.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      if (isEdit && existing) {
        await update.mutateAsync({
          id: existing.id,
          groupId,
          patch: {
            kind,
            label: label.trim(),
            note: note.trim() || null,
            session_run_id: sessionId === 'current' ? null : sessionId,
          },
        });
        toast.success('관계를 수정했어요');
      } else {
        await create.mutateAsync({
          groupId,
          fromCharacterId: fromId,
          toCharacterId: toId,
          sessionRunId: sessionId === 'current' ? null : sessionId,
          kind,
          label: label.trim(),
          note: note.trim() || null,
        });
        toast.success('관계를 추가했어요');
      }
      onOpenChange(false);
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`저장 실패: ${msg}`);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!confirm('이 관계를 삭제할까요?')) return;
    try {
      await del.mutateAsync({ id: existing.id, groupId });
      toast.success('관계를 삭제했어요');
      onOpenChange(false);
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`삭제 실패: ${msg}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '관계 수정' : '관계 추가'}</DialogTitle>
          <DialogDescription>
            방향이 있는 관계입니다 — A→B 와 B→A 는 따로 적을 수 있어요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* From → To */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">대상 (출발)</Label>
              <Select value={fromId} onValueChange={setFromId} disabled={isEdit}>
                <SelectTrigger>
                  <SelectValue placeholder="캐릭터" />
                </SelectTrigger>
                <SelectContent>
                  {characters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ArrowRight className="mb-2 h-4 w-4 text-muted-foreground" />
            <div className="space-y-1.5">
              <Label className="text-xs">대상 (도착)</Label>
              <Select value={toId} onValueChange={setToId} disabled={isEdit}>
                <SelectTrigger>
                  <SelectValue placeholder="캐릭터" />
                </SelectTrigger>
                <SelectContent>
                  {characters
                    .filter((c) => c.id !== fromId)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Kind */}
          <div className="space-y-1.5">
            <Label className="text-xs">관계 종류</Label>
            <div className="flex flex-wrap gap-2">
              {RELATION_KINDS.map((k) => {
                const s = RELATION_STYLES[k];
                const active = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      active ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: active ? s.bg : 'transparent',
                      borderColor: s.border,
                      color: s.color,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="rel-label" className="text-xs">
              라벨 (자유)
            </Label>
            <Input
              id="rel-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="라이벌, 빚, 연인 등"
              list={labelListId}
              maxLength={50}
            />
            <datalist id={labelListId}>
              {labelSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* Viewpoint */}
          <div className="space-y-1.5">
            <Label className="text-xs">시점</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">현재 (캠페인 후 정착)</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                    {s.scheduled_at
                      ? ` · ${new Date(s.scheduled_at).toLocaleDateString('ko-KR')}`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="rel-note" className="text-xs">
              메모 (선택)
            </Label>
            <Textarea
              id="rel-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="배경, 사건, 일화 등"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between gap-2 sm:justify-between">
          {isEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={del.isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              삭제
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || create.isPending || update.isPending}
            >
              {isEdit ? '저장' : '추가'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
