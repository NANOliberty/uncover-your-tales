import { useState } from 'react';
import { Link, Navigate, useOutletContext, useParams } from 'react-router';
import { ArrowLeft, BookOpen, Crown, Pencil, User, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import type {
  GroupRow,
  SessionStatus,
} from '../lib/supabase/database.types';
import { useSession } from '../features/auth/useSession';
import {
  useSessionParticipants,
  useSessionRun,
} from '../features/sessions/api';
import {
  useRemoveParticipant,
  useUpdateParticipant,
  useUpdateSessionRun,
} from '../features/sessions/mutations';
import { AddParticipantDialog } from '../features/sessions/AddParticipantDialog';
import { useScenario } from '../features/scenarios/api';
import { useGroupCharacters } from '../features/characters/api';

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
  cancelled: 'bg-muted text-muted-foreground',
};

export function SessionDetailPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useSession();
  const { data: session, isLoading, isError } = useSessionRun(sessionId);
  const { data: scenario } = useScenario(session?.scenario_id ?? undefined);
  const { data: participants = [] } = useSessionParticipants(sessionId);
  const { data: characters = [] } = useGroupCharacters(group.id);

  const updateRun = useUpdateSessionRun();
  const updatePart = useUpdateParticipant();
  const removePart = useRemoveParticipant();

  const [notesDraft, setNotesDraft] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        세션 불러오는 중…
      </div>
    );
  }
  if (isError || !session) return <Navigate to=".." replace relative="path" />;

  const isCreator = user?.id === session.created_by;
  const myParticipation = participants.find((p) => p.user_id === user?.id);
  const isParticipant = !!myParticipation;
  const notes = notesDraft ?? session.notes ?? '';

  const setStatus = async (status: SessionStatus) => {
    const patch: Record<string, unknown> = { status };
    if (status === 'in_progress' && !session.started_at) {
      patch.started_at = new Date().toISOString();
    }
    if (status === 'completed' && !session.ended_at) {
      patch.ended_at = new Date().toISOString();
    }
    try {
      await updateRun.mutateAsync({ id: session.id, patch });
      toast.success('상태가 변경되었어요');
    } catch (e) {
      toast.error(`상태 변경 실패: ${(e as { message?: string })?.message ?? ''}`);
    }
  };

  const saveNotes = async () => {
    if (notesDraft === null || notesDraft === (session.notes ?? '')) {
      setNotesDraft(null);
      return;
    }
    try {
      await updateRun.mutateAsync({
        id: session.id,
        patch: { notes: notesDraft.trim() || null },
      });
      toast.success('메모 저장됨');
      setNotesDraft(null);
    } catch (e) {
      toast.error(`저장 실패: ${(e as { message?: string })?.message ?? ''}`);
    }
  };

  const linkCharacter = async (characterId: string | null) => {
    if (!myParticipation) return;
    try {
      await updatePart.mutateAsync({
        sessionRunId: session.id,
        userId: myParticipation.user_id,
        patch: { character_id: characterId },
      });
      toast.success(characterId ? '캐릭터 연결됨' : '캐릭터 연결 해제');
    } catch (e) {
      toast.error(`실패: ${(e as { message?: string })?.message ?? ''}`);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link to=".." relative="path">
            <ArrowLeft className="mr-1 h-4 w-4" />
            목록
          </Link>
        </Button>
        {isCreator && (
          <Button asChild size="sm">
            <Link to="edit">
              <Pencil className="mr-1 h-3 w-3" />
              편집
            </Link>
          </Button>
        )}
      </div>

      {/* 헤더 */}
      <header className="mb-6 rounded-lg border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {session.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_TONE[session.status]}`}
              >
                {STATUS_LABEL[session.status]}
              </span>
              <DateBadges session={session} />
            </div>
            {scenario && (
              <Link
                to={`/g/${group.slug}/scenarios/${scenario.id}`}
                className="mt-3 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm transition hover:border-primary/40"
              >
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{scenario.title}</span>
                <span className="text-xs text-muted-foreground">시나리오</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 상태 컨트롤 — 등록자만 */}
      {isCreator && (
        <section className="mb-6 rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">상태</h2>
          <div className="flex flex-wrap gap-2">
            {(['planned', 'in_progress', 'completed', 'cancelled'] as SessionStatus[]).map(
              (st) => (
                <Button
                  key={st}
                  type="button"
                  size="sm"
                  variant={session.status === st ? 'default' : 'outline'}
                  onClick={() => setStatus(st)}
                  disabled={session.status === st || updateRun.isPending}
                >
                  {STATUS_LABEL[st]}
                </Button>
              ),
            )}
          </div>
        </section>
      )}

      {/* 참여자 */}
      <section className="mb-6 rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">참여자</h2>
          {isCreator && (
            <AddParticipantDialog
              sessionRunId={session.id}
              groupId={session.group_id}
              currentParticipants={participants}
              trigger={
                <Button type="button" size="sm" variant="outline">
                  <UserPlus className="mr-1 h-3 w-3" />
                  추가
                </Button>
              }
            />
          )}
        </div>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">참여자가 없습니다.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {participants.map((p) => {
              const isMe = p.user_id === user?.id;
              const linkedCharacter = characters.find((c) => c.id === p.character_id);
              return (
                <li
                  key={p.user_id}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm"
                >
                  {p.profile?.avatar_url ? (
                    <img
                      src={p.profile.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full border object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col leading-tight">
                    <span className="font-medium">
                      {p.profile?.display_name ?? '(알 수 없음)'}
                      {isMe && (
                        <span className="ml-1 text-[10px] text-muted-foreground">(나)</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.role === 'gm' ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Crown className="h-3 w-3" /> KP
                        </span>
                      ) : p.role === 'guest' ? (
                        '게스트'
                      ) : (
                        'PL'
                      )}
                      {linkedCharacter && (
                        <>
                          {' · '}
                          <Link
                            to={`/g/${group.slug}/characters/${linkedCharacter.id}`}
                            className="text-foreground hover:underline"
                          >
                            {linkedCharacter.name}
                          </Link>
                        </>
                      )}
                    </span>
                  </div>
                  {/* 본인의 캐릭터 link 변경 */}
                  {isMe && p.role !== 'gm' && (
                    <select
                      value={p.character_id ?? ''}
                      onChange={(e) => linkCharacter(e.target.value || null)}
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                    >
                      <option value="">캐릭터 미연결</option>
                      {characters
                        .filter((c) => c.owner_id === user?.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  )}
                  {/* 등록자가 다른 사람 제거 또는 본인 자진 탈퇴 */}
                  {(isCreator || isMe) && p.role !== 'gm' && (
                    <button
                      type="button"
                      onClick={() =>
                        removePart.mutate({
                          sessionRunId: session.id,
                          userId: p.user_id,
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                      title={isMe ? '나가기' : '제거'}
                      aria-label={isMe ? '나가기' : '제거'}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 메모 — 누구나(참여자/그룹멤버) 보기 가능, 등록자만 수정 */}
      <section className="mb-6 rounded-lg border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">메모</h2>
          {isCreator && notesDraft !== null && (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setNotesDraft(null)}
              >
                취소
              </Button>
              <Button size="sm" onClick={saveNotes} disabled={updateRun.isPending}>
                저장
              </Button>
            </div>
          )}
        </div>
        {isCreator ? (
          <Textarea
            value={notes}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="진행 메모, 일정 변경 사항, 회차별 요점 등"
            rows={4}
            className="text-sm"
          />
        ) : session.notes ? (
          <p className="whitespace-pre-wrap text-sm">{session.notes}</p>
        ) : (
          <p className="text-sm text-muted-foreground">메모가 없습니다.</p>
        )}
      </section>

    </div>
  );
}

/**
 * 일정 배지. 상태에 따라 가장 의미있는 시각만 강조해서 표시.
 *  - planned: 예약 (강조)
 *  - in_progress: 시작 (강조), 예약 (옅게)
 *  - completed: 시작·종료 (강조)
 *  - cancelled: 예약·시작 (있는 거)
 */
function DateBadges({
  session,
}: {
  session: { status: SessionStatus; scheduled_at: string | null; started_at: string | null; ended_at: string | null };
}) {
  const items: { label: string; iso: string; emphasis: boolean }[] = [];
  switch (session.status) {
    case 'planned':
      if (session.scheduled_at) items.push({ label: '예약', iso: session.scheduled_at, emphasis: true });
      break;
    case 'in_progress':
      if (session.started_at) items.push({ label: '시작', iso: session.started_at, emphasis: true });
      if (session.scheduled_at) items.push({ label: '예약', iso: session.scheduled_at, emphasis: false });
      break;
    case 'completed':
      if (session.started_at) items.push({ label: '시작', iso: session.started_at, emphasis: true });
      if (session.ended_at) items.push({ label: '종료', iso: session.ended_at, emphasis: true });
      break;
    case 'cancelled':
      if (session.scheduled_at) items.push({ label: '예약', iso: session.scheduled_at, emphasis: false });
      if (session.started_at) items.push({ label: '시작', iso: session.started_at, emphasis: false });
      break;
  }
  if (items.length === 0) {
    return <span className="text-xs text-muted-foreground">일정 미정</span>;
  }
  return (
    <>
      {items.map((it, i) => (
        <span
          key={`${it.label}-${i}`}
          className={[
            'text-xs',
            it.emphasis ? 'text-foreground' : 'text-muted-foreground/70',
          ].join(' ')}
        >
          {i > 0 && <span className="mx-1 text-muted-foreground/50">·</span>}
          <span className="text-muted-foreground">{it.label}</span> {formatDate(it.iso)}
        </span>
      ))}
    </>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '미정';
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

