import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, useParams } from 'react-router';
import { Sparkles } from 'lucide-react';
import { useActiveGroupStore } from '../features/groups/active-group-store';
import { useGroupBySlug, useMyMembership } from '../features/groups/api';

/**
 * `/g/:slug/*` 의 컨텍스트 레이아웃.
 * - 슬러그를 검증한다 — 존재하지 않거나 RLS 로 막히면 /groups 로.
 * - 그룹 정보(이름, 로고)를 표시한다.
 * - 활성 슬러그를 영속 스토어에 동기화 — 다음 방문 시 마지막 그룹으로 부드럽게 복귀.
 * - solo group(개인 작업실) 은 표기를 다르게 하고 설정/구인 같은 무의미한 탭은 숨긴다.
 */
const sharedSubnav = [
  { to: 'characters', label: '캐릭터' },
  { to: 'scenarios', label: '시나리오' },
  { to: 'sessions', label: '세션 기록' },
  { to: 'relations', label: '관계 맵' },
  { to: 'recruitment', label: '구인' },
];

const soloSubnav = [
  { to: 'characters', label: '캐릭터' },
  { to: 'scenarios', label: '시나리오' },
  { to: 'sessions', label: '세션 기록' },
];

export function GroupShell() {
  const { slug } = useParams<{ slug: string }>();
  const setActiveSlug = useActiveGroupStore((s) => s.setActiveSlug);
  const { data: group, isLoading, isError } = useGroupBySlug(slug);
  const { data: role } = useMyMembership(group?.id);
  const isAdmin = role === 'admin';
  const isSolo = group?.is_solo ?? false;
  const subnav = isSolo ? soloSubnav : sharedSubnav;

  useEffect(() => {
    if (group) setActiveSlug(group.slug);
  }, [group, setActiveSlug]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
        그룹 정보 불러오는 중…
      </div>
    );
  }

  if (isError || !group) {
    return <Navigate to="/groups" replace />;
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-3">
          <div className="flex items-center gap-3">
            {isSolo ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            ) : group.logo_url ? (
              <img
                src={group.logo_url}
                alt=""
                className="h-7 w-7 rounded-md border object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted text-xs font-medium text-muted-foreground">
                {group.name.charAt(0)}
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium">
                {isSolo ? '내 작업실' : group.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {isSolo ? '솔로 작업 · 단발 준비 · 비공개' : `/g/${group.slug}`}
              </span>
            </div>
          </div>
          <nav className="-mx-2 flex items-center gap-1 overflow-x-auto">
            {subnav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={false}
                className={({ isActive }) =>
                  [
                    'whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition',
                    isActive
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
            {/* 설정(초대 발급 등) 은 공유 그룹의 admin 에게만 의미 — solo 에선 숨김 */}
            {isAdmin && !isSolo && (
              <NavLink
                to="settings"
                end={false}
                className={({ isActive }) =>
                  [
                    'ml-auto whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition',
                    isActive
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')
                }
              >
                설정
              </NavLink>
            )}
          </nav>
        </div>
      </div>

      <Outlet context={{ group }} />
    </div>
  );
}
