import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { Plus, Search, User, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import type { CharacterStatus, GroupRow, TrpgSystem } from '../lib/supabase/database.types';
import { useGroupCharacters } from '../features/characters/api';

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

const STATUS_LABEL: Record<string, string> = {
  active: '활동 중',
  retired: '은퇴',
  dead: '사망',
};

type SortKey = 'updated' | 'name' | 'created';

const SORT_LABEL: Record<SortKey, string> = {
  updated: '최근 수정 순',
  name: '이름 가나다순',
  created: '오래된 순',
};

export function CharactersPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { data: characters = [], isLoading } = useGroupCharacters(group.id);

  const [query, setQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState<TrpgSystem | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CharacterStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updated');

  // 갤러리에서 등장하는 시스템·상태만 필터로 노출 (빈 옵션 제거)
  const availableSystems = useMemo(
    () => Array.from(new Set(characters.map((c) => c.system))),
    [characters],
  );
  const availableStatuses = useMemo(
    () => Array.from(new Set(characters.map((c) => c.status))),
    [characters],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = characters.filter((c) => {
      if (systemFilter !== 'all' && c.system !== systemFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (q) {
        const haystack = `${c.name} ${c.occupation ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    arr = [...arr].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'ko');
      if (sortKey === 'created')
        return a.created_at.localeCompare(b.created_at);
      // 'updated' default
      return b.updated_at.localeCompare(a.updated_at);
    });
    return arr;
  }, [characters, query, systemFilter, statusFilter, sortKey]);

  const hasFilters =
    query.trim().length > 0 || systemFilter !== 'all' || statusFilter !== 'all';
  const clearFilters = () => {
    setQuery('');
    setSystemFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">캐릭터</h2>
          <p className="text-sm text-muted-foreground">
            {group.is_solo
              ? '솔로 캐릭터를 만들고 다듬어 두세요. 단발이나 정기 그룹에서 그대로 사용할 수 있습니다.'
              : '같은 그룹 멤버는 서로의 캐릭터를 볼 수 있습니다.'}
          </p>
        </div>
        <Button asChild>
          <Link to="new">
            <Plus className="mr-1 h-4 w-4" />새 캐릭터
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : characters.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center">
          <p className="text-sm font-medium">아직 캐릭터가 없어요</p>
          <p className="mt-1 text-sm text-muted-foreground">
            CoC 7판부터 만들 수 있습니다. 다른 시스템은 곧 추가됩니다.
          </p>
          <Button asChild className="mt-4">
            <Link to="new">첫 캐릭터 만들기</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* 검색 + 필터 + 정렬 */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="이름 / 직업 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {availableSystems.length > 1 && (
              <FilterChips
                value={systemFilter}
                onChange={setSystemFilter}
                options={[
                  { value: 'all', label: '전체 시스템' },
                  ...availableSystems.map((s) => ({
                    value: s,
                    label: SYSTEM_LABEL[s] ?? s,
                  })),
                ]}
              />
            )}

            {availableStatuses.length > 1 && (
              <FilterChips
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: '전체 상태' },
                  ...availableStatuses.map((s) => ({
                    value: s,
                    label: STATUS_LABEL[s] ?? s,
                  })),
                ]}
              />
            )}

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>

            {hasFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3 w-3" />
                초기화
              </Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} / {characters.length}
            </span>
          </div>

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              조건과 일치하는 캐릭터가 없습니다.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {filtered.map((c) => {
                const isInactive = c.status !== 'active';
                return (
                  <li key={c.id}>
                    <Link
                      to={c.id}
                      className={[
                        'flex items-center gap-3 px-4 py-3 transition hover:bg-accent/50',
                        isInactive && 'opacity-70',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {c.portrait_url ? (
                        <img
                          src={c.portrait_url}
                          alt=""
                          className={[
                            'h-12 w-12 shrink-0 rounded-md border object-cover',
                            c.status === 'dead' && 'grayscale',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col leading-tight">
                        <span className="text-sm font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {SYSTEM_LABEL[c.system] ?? c.system}
                          {c.occupation ? ` · ${c.occupation}` : ''}
                        </span>
                      </div>
                      {isInactive && (
                        <span
                          className={[
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px]',
                            c.status === 'dead'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted text-muted-foreground',
                          ].join(' ')}
                        >
                          {STATUS_LABEL[c.status]}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'rounded-full border px-2.5 py-1 text-xs transition',
            value === opt.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
