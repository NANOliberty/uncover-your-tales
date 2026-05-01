import { Link, Navigate, useOutletContext, useParams } from 'react-router';
import { ArrowLeft, BookOpen, Pencil } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { GroupRow } from '../lib/supabase/database.types';
import { useScenario } from '../features/scenarios/api';
import { useSessionsByScenario } from '../features/sessions/api';
import { useSession } from '../features/auth/useSession';

interface GroupOutletContext {
  group: GroupRow;
}

const SYSTEM_LABEL: Record<string, string> = {
  coc7: 'CoC 7판',
  dnd5e: 'D&D 5e',
  dungeon_world: '던전월드',
  fiasco: 'Fiasco',
  insane: '인세인',
  shahonkok: '사혼곡',
  custom: '커스텀',
};

interface GMOnly {
  spoilers?: string;
  npcs?: string;
  branches?: string;
}

export function ScenarioDetailPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { data: scenario, isLoading, isError } = useScenario(scenarioId);
  const { user } = useSession();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        시나리오 불러오는 중…
      </div>
    );
  }
  if (isError || !scenario) return <Navigate to=".." replace relative="path" />;

  const isOwner = user?.id === scenario.owner_id;
  const gm = (scenario.gm_only ?? {}) as GMOnly;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link to=".." relative="path">
            <ArrowLeft className="mr-1 h-4 w-4" />
            목록
          </Link>
        </Button>
        {isOwner && (
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
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {scenario.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {scenario.author ?? '작가 미입력'}
              {scenario.recommended_players ? ` · ${scenario.recommended_players}` : ''}
              {scenario.expected_play_time ? ` · ${scenario.expected_play_time}` : ''}
              {scenario.difficulty ? ` · ${scenario.difficulty}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge>{SYSTEM_LABEL[scenario.system] ?? scenario.system}</Badge>
              {scenario.genre_tags?.map((t) => (
                <Badge key={`g-${t}`}>#{t}</Badge>
              ))}
              {scenario.trigger_warnings?.map((t) => (
                <Badge key={`tw-${t}`} danger>
                  ⚠ {t}
                </Badge>
              ))}
              {isOwner && <Badge accent>등록자</Badge>}
            </div>
          </div>
        </div>
      </header>

      {/* 공개 영역 */}
      {scenario.description && (
        <Section title="시나리오 소개">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{scenario.description}</p>
        </Section>
      )}

      {scenario.handout && (
        <Section title="핸드아웃">
          <p className="whitespace-pre-wrap text-sm">{scenario.handout}</p>
        </Section>
      )}

      {scenario.bgm_recommendation && (
        <Section title="추천 BGM">
          <p className="whitespace-pre-wrap text-sm">{scenario.bgm_recommendation}</p>
        </Section>
      )}

      {/* GM 전용 영역 — 등록자에게만 */}
      {isOwner && (gm.spoilers || gm.npcs || gm.branches) && (
        <section className="mb-6 rounded-lg border border-amber-500/30 bg-amber-50/50 p-5 dark:bg-amber-950/10">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-medium text-amber-700 dark:text-amber-400">
              GM 전용 (스포일러)
            </h2>
            <span className="text-[11px] text-muted-foreground">등록자만 표시</span>
          </div>
          <div className="space-y-4 text-sm">
            {gm.spoilers && <SubBlock label="스포일러 / 진실" body={gm.spoilers} />}
            {gm.npcs && <SubBlock label="NPC 스탯" body={gm.npcs} />}
            {gm.branches && <SubBlock label="분기 / 노트" body={gm.branches} />}
          </div>
        </section>
      )}

      <ScenarioSessionsSection scenarioId={scenario.id} groupSlug={group.slug} />
    </div>
  );
}

/** 이 시나리오로 진행된 세션 목록 (역참조). */
function ScenarioSessionsSection({
  scenarioId,
  groupSlug,
}: {
  scenarioId: string;
  groupSlug: string;
}) {
  const { data: sessions = [], isLoading } = useSessionsByScenario(scenarioId);

  const STATUS_TONE: Record<string, string> = {
    planned: 'bg-muted text-muted-foreground',
    in_progress: 'bg-primary/10 text-primary',
    completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    cancelled: 'bg-muted text-muted-foreground',
  };
  const STATUS_LABEL: Record<string, string> = {
    planned: '예정',
    in_progress: '진행 중',
    completed: '완료',
    cancelled: '취소',
  };

  return (
    <section className="mb-6 rounded-lg border bg-card p-5">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        굴린 세션 <span className="ml-1 text-xs">{sessions.length}</span>
      </h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 굴린 적 없습니다.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                to={`/g/${groupSlug}/sessions/${s.id}`}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm transition hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.title}</p>
                  {s.scheduled_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.scheduled_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${STATUS_TONE[s.status] ?? ''}`}
                >
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-lg border bg-card p-5">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function SubBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap">{body}</p>
    </div>
  );
}

function Badge({
  children,
  accent,
  danger,
}: {
  children: React.ReactNode;
  accent?: boolean;
  danger?: boolean;
}) {
  const cls = danger
    ? 'rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive'
    : accent
      ? 'rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary'
      : 'rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground';
  return <span className={cls}>{children}</span>;
}
