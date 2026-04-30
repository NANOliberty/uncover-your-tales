import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { BookOpen, Plus, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import type { GroupRow, TrpgSystem } from '../lib/supabase/database.types';
import { useGroupScenarios } from '../features/scenarios/api';

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

export function ScenariosPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { data: scenarios = [], isLoading } = useGroupScenarios(group.id);

  const [query, setQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState<TrpgSystem | 'all'>('all');

  const availableSystems = useMemo(
    () => Array.from(new Set(scenarios.map((s) => s.system))),
    [scenarios],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenarios.filter((s) => {
      if (systemFilter !== 'all' && s.system !== systemFilter) return false;
      if (q) {
        const hay = `${s.title} ${s.author ?? ''} ${(s.genre_tags ?? []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scenarios, query, systemFilter]);

  const hasFilters = query.trim().length > 0 || systemFilter !== 'all';

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">시나리오</h2>
          <p className="text-sm text-muted-foreground">
            {group.is_solo
              ? '시나리오 자체. 같은 시나리오를 여러 번 굴리면 굴림마다 별도 세션 기록이 됩니다.'
              : '그룹 멤버가 등록한 시나리오들. 등록자만 수정/삭제할 수 있습니다.'}
          </p>
        </div>
        <Button asChild>
          <Link to="new">
            <Plus className="mr-1 h-4 w-4" />새 시나리오
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : scenarios.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">아직 시나리오가 없어요</p>
          <p className="mt-1 text-sm text-muted-foreground">
            굴려본 시나리오를 등록해 두면 다음에 또 굴릴 때 기록이 자연스럽게 쌓입니다.
          </p>
          <Button asChild className="mt-4">
            <Link to="new">첫 시나리오 등록</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="제목 / 작가 / 태그 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {availableSystems.length > 1 && (
              <div className="flex flex-wrap items-center gap-1">
                <FilterChip
                  active={systemFilter === 'all'}
                  onClick={() => setSystemFilter('all')}
                >
                  전체 시스템
                </FilterChip>
                {availableSystems.map((s) => (
                  <FilterChip
                    key={s}
                    active={systemFilter === s}
                    onClick={() => setSystemFilter(s)}
                  >
                    {SYSTEM_LABEL[s] ?? s}
                  </FilterChip>
                ))}
              </div>
            )}

            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setSystemFilter('all');
                }}
              >
                <X className="mr-1 h-3 w-3" />
                초기화
              </Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} / {scenarios.length}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
              조건과 일치하는 시나리오가 없습니다.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <li key={s.id}>
                  <Link
                    to={s.id}
                    className="block h-full rounded-lg border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate text-base font-medium">{s.title}</h3>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {SYSTEM_LABEL[s.system] ?? s.system}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {s.author ?? '작가 미입력'}
                      {s.recommended_players ? ` · ${s.recommended_players}` : ''}
                      {s.expected_play_time ? ` · ${s.expected_play_time}` : ''}
                    </p>
                    {s.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                    {(s.genre_tags?.length || s.trigger_warnings?.length) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.genre_tags?.map((t) => (
                          <span
                            key={`g-${t}`}
                            className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            #{t}
                          </span>
                        ))}
                        {s.trigger_warnings?.map((t) => (
                          <span
                            key={`tw-${t}`}
                            className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive"
                          >
                            ⚠ {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-2.5 py-1 text-xs transition',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'bg-card text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
