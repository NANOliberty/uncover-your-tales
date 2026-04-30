import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import type { GroupRow } from '../lib/supabase/database.types';
import { useGroupScenarios } from '../features/scenarios/api';
import { useCreateSessionRun } from '../features/sessions/mutations';

interface GroupOutletContext {
  group: GroupRow;
}

export function SessionNewPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const navigate = useNavigate();
  const create = useCreateSessionRun();
  const { data: scenarios = [] } = useGroupScenarios(group.id);

  const [title, setTitle] = useState('');
  const [scenarioId, setScenarioId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await create.mutateAsync({
        groupId: group.id,
        scenarioId: scenarioId || null,
        title: title.trim() || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      toast.success('세션이 만들어졌어요');
      navigate(`/g/${group.slug}/sessions/${created.id}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[create-session] failed:', err);
      const msg = (err as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`생성 실패: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">{group.is_solo ? '내 작업실' : group.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">새 세션</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          만들면 본인이 자동으로 GM 으로 등록됩니다. 다른 참여자와 캐릭터는 다음 단계에서 추가하세요.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="scenario">시나리오 (선택)</Label>
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
          {scenarios.length === 0 && (
            <p className="text-xs text-muted-foreground">
              아직 등록된 시나리오가 없어 미정으로 만듭니다. 진행 중에도 시나리오를 연결할 수 있어요.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">제목 (선택)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="비워두면 시나리오 제목 + 날짜로 자동 생성"
            maxLength={200}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="scheduled">예약 일시</Label>
          <Input
            id="scheduled"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '만드는 중…' : '세션 만들기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
