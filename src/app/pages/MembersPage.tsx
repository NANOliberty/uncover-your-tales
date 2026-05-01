import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { Crown, Search, Shield, User } from 'lucide-react';
import { Input } from '../components/ui/input';
import type { GroupRole, GroupRow } from '../lib/supabase/database.types';
import { useGroupMembers } from '../features/groups/api';
import { useSession } from '../features/auth/useSession';

interface GroupOutletContext {
  group: GroupRow;
}

const ROLE_LABEL: Record<GroupRole, string> = {
  admin: '관리자',
  member: '멤버',
  guest: '게스트',
};

const ROLE_TONE: Record<GroupRole, string> = {
  admin: 'bg-primary/10 text-primary',
  member: 'bg-muted text-muted-foreground',
  guest: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

function formatJoined(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function MembersPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { user } = useSession();
  const { data: members = [], isLoading } = useGroupMembers(group.id);
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const c = { admin: 0, member: 0, guest: 0 };
    for (const m of members) c[m.role]++;
    return c;
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      (m.profile?.display_name ?? '').toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">멤버</h2>
        <p className="text-sm text-muted-foreground">
          {group.is_solo
            ? '내 작업실은 본인만 사용합니다.'
            : '이 그룹의 모든 멤버. 관리자만 역할 변경 / 강퇴 가능 (다음 라운드).'}
        </p>
        {!group.is_solo && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              관리자 {counts.admin}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              멤버 {counts.member}
            </span>
            {counts.guest > 0 && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-400">
                게스트 {counts.guest}
              </span>
            )}
          </div>
        )}
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : (
        <>
          {members.length > 5 && (
            <div className="relative mb-4 w-full sm:w-80">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="이름 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {query ? '검색 결과가 없습니다.' : '멤버가 없습니다.'}
            </p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {filtered.map((m) => {
                const isMe = m.user_id === user?.id;
                return (
                  <li
                    key={m.user_id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {m.profile?.avatar_url ? (
                      <img
                        src={m.profile.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full border object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col leading-tight">
                      <span className="text-sm font-medium">
                        {m.profile?.display_name ?? '(이름 없음)'}
                        {isMe && (
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            (나)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatJoined(m.joined_at)} 가입
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${ROLE_TONE[m.role]}`}
                    >
                      {m.role === 'admin' && <Crown className="mr-1 inline h-2.5 w-2.5" />}
                      {m.role === 'guest' && <Shield className="mr-1 inline h-2.5 w-2.5" />}
                      {ROLE_LABEL[m.role]}
                    </span>
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
