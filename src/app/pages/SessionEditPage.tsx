import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
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
} from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import type { GroupRow, SessionStatus } from '../lib/supabase/database.types';
import { useSessionRun } from '../features/sessions/api';
import { useDeleteSessionRun, useUpdateSessionRun } from '../features/sessions/mutations';
import { useGroupScenarios } from '../features/scenarios/api';
import { useSession } from '../features/auth/useSession';

interface GroupOutletContext {
  group: GroupRow;
}

const STATUS_OPTIONS: { value: SessionStatus; label: string }[] = [
  { value: 'planned', label: '예정' },
  { value: 'in_progress', label: '진행 중' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' },
];

/** ISO string → datetime-local input value (YYYY-MM-DDTHH:mm). 로컬 타임존 기준. */
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  // toISOString 은 UTC. 로컬 표기로 변환.
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function SessionEditPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: session, isLoading } = useSessionRun(sessionId);
  const { data: scenarios = [] } = useGroupScenarios(group.id);
  const update = useUpdateSessionRun();
  const del = useDeleteSessionRun();

  const [title, setTitle] = useState('');
  const [scenarioId, setScenarioId] = useState<string>('');
  const [status, setStatus] = useState<SessionStatus>('planned');
  const [scheduledAt, setScheduledAt] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [delConfirmText, setDelConfirmText] = useState('');
  const [delOpen, setDelOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    setTitle(session.title);
    setScenarioId(session.scenario_id ?? '');
    setStatus(session.status);
    setScheduledAt(isoToLocalInput(session.scheduled_at));
    setStartedAt(isoToLocalInput(session.started_at));
    setEndedAt(isoToLocalInput(session.ended_at));
    setNotes(session.notes ?? '');
  }, [session]);

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted-foreground">불러오는 중…</div>;
  }
  if (!session) return <Navigate to=".." replace relative="path" />;
  if (user && session.created_by !== user.id) {
    return <Navigate to={`/g/${group.slug}/sessions/${session.id}`} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('제목을 입력하세요');
      return;
    }
    // 시작·종료 일관성 체크
    const startedIso = localInputToIso(startedAt);
    const endedIso = localInputToIso(endedAt);
    if (startedIso && endedIso && new Date(endedIso) < new Date(startedIso)) {
      toast.error('종료 시각은 시작 시각 이후여야 합니다');
      return;
    }
    setSubmitting(true);
    try {
      await update.mutateAsync({
        id: session.id,
        patch: {
          title: title.trim(),
          scenario_id: scenarioId || null,
          status,
          scheduled_at: localInputToIso(scheduledAt),
          started_at: startedIso,
          ended_at: endedIso,
          notes: notes.trim() || null,
        },
      });
      toast.success('저장됨');
      navigate(`/g/${group.slug}/sessions/${session.id}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[update-session] failed:', err);
      const msg = (err as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`저장 실패: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (delConfirmText.trim() !== session.title.trim()) return;
    try {
      await del.mutateAsync(session.id);
      toast.success('세션이 삭제되었어요');
      setDelOpen(false);
      navigate(`/g/${group.slug}/sessions`, { replace: true });
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`삭제 실패: ${msg}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">{group.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{session.title} 편집</h1>
      </header>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">기본 정보</h2>

          <div className="space-y-1.5">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scenario">시나리오</Label>
            <select
              id="scenario"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="h-9 w-full rounded-md border bg-input-background px-3 text-sm outline-none focus:border-ring"
            >
              <option value="">시나리오 미정</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>상태</Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={[
                    'rounded-md border px-3 py-1.5 text-sm transition',
                    status === opt.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">일정</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              "예약" 은 예정된 시간, "시작/종료" 는 실제 진행 시각. 진행 중·완료로 상태를
              바꾸면 자동 입력되지만 여기서 수동으로 정정할 수 있습니다.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="scheduled">예약 일시</Label>
              <Input
                id="scheduled"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="started">시작 시각</Label>
              <Input
                id="started"
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ended">종료 시각</Label>
              <Input
                id="ended"
                type="datetime-local"
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">
            메모
          </Label>
          <Textarea
            id="notes"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="진행 메모, 일정 변경, 회차별 요점"
          />
        </section>

        {/* 위험 영역 — 삭제 */}
        <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="text-sm font-medium text-destructive">위험 영역</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            세션을 삭제합니다. 참여 기록(캐릭터 연결)도 모두 끊어집니다.
          </p>
          <div className="mt-3">
            <AlertDialog
              open={delOpen}
              onOpenChange={(v) => {
                setDelOpen(v);
                if (!v) setDelConfirmText('');
              }}
            >
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 className="mr-1 h-4 w-4" />
                  세션 삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말 삭제할까요?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="font-medium text-foreground">{session.title}</span> 의
                    참여 기록·메모가 영구 삭제됩니다. 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    확인을 위해 제목을 정확히 입력하세요.
                  </label>
                  <Input
                    value={delConfirmText}
                    onChange={(e) => setDelConfirmText(e.target.value)}
                    placeholder={session.title}
                    autoFocus
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={
                      delConfirmText.trim() !== session.title.trim() || del.isPending
                    }
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
          </div>
        </section>

        <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-lg border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/g/${group.slug}/sessions/${session.id}`)}
          >
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '저장 중…' : '저장'}
          </Button>
        </div>
      </form>
    </div>
  );
}
