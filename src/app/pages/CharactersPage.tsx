import { Link, useOutletContext } from 'react-router';
import { Plus, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { GroupRow } from '../lib/supabase/database.types';
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

export function CharactersPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { data: characters = [], isLoading } = useGroupCharacters(group.id);

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
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
            <li key={c.id}>
              <Link
                to={c.id}
                className="flex h-full items-center gap-3 rounded-lg border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                {c.portrait_url ? (
                  <img
                    src={c.portrait_url}
                    alt=""
                    className="h-12 w-12 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div className="flex flex-1 flex-col leading-tight">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {SYSTEM_LABEL[c.system] ?? c.system}
                    {c.occupation ? ` · ${c.occupation}` : ''}
                  </span>
                  {c.status !== 'active' && (
                    <span className="mt-1 inline-block w-fit rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {STATUS_LABEL[c.status]}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
