import { Link, useOutletContext } from 'react-router';
import { CalendarDays, CircleDot, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { GroupRow, SessionStatus } from '../lib/supabase/database.types';
import { useGroupSessions } from '../features/sessions/api';

interface GroupOutletContext {
  group: GroupRow;
}

const STATUS_LABEL: Record<SessionStatus, string> = {
  planned: '예정',
  in_progress: '진행 중',
  completed: '완료',
  cancelled: '취소',
};

const STATUS_TONE: Record<SessionStatus, string> = {
  planned: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-muted text-muted-foreground line-through',
};

function formatDate(iso: string | null): string {
  if (!iso) return '일정 미정';
  try {
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function SessionsPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { data: sessions = [], isLoading } = useGroupSessions(group.id);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">세션</h2>
          <p className="text-sm text-muted-foreground">
            실제 굴려진(또는 굴릴) 세션들. 같은 시나리오를 여러 번 굴려도 각각 독립 기록.
          </p>
        </div>
        <Button asChild>
          <Link to="new">
            <Plus className="mr-1 h-4 w-4" />새 세션
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">아직 등록된 세션이 없어요</p>
          <p className="mt-1 text-sm text-muted-foreground">
            시나리오를 골라 첫 세션을 만들면 일정·참여자·기록이 한곳에 쌓입니다.
          </p>
          <Button asChild className="mt-4">
            <Link to="new">첫 세션 만들기</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                to={s.id}
                className="block px-4 py-3 transition hover:bg-accent/50"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate text-base font-medium">{s.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${STATUS_TONE[s.status]}`}
                  >
                    <CircleDot className="mr-1 inline h-2.5 w-2.5" />
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {formatDate(s.scheduled_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
