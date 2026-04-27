import { useEffect } from 'react';
import { NavLink, Outlet, useParams } from 'react-router';
import { useActiveGroupStore } from '../features/groups/active-group-store';

/**
 * 그룹 컨텍스트 레이아웃 — `/g/:slug/*` 의 공통 헤더 역할.
 *
 * 지금은 슬러그를 활성 그룹 스토어에 동기화하고 컨텍스트 네비게이션을 보여준다.
 * M1.3 에서 useGroupBySlug() 로 실 데이터를 끌어와 슬러그가 유효하지 않으면
 * /groups 로 리다이렉트하고, 그룹 이름과 로고를 표시한다.
 */
const subnav = [
  { to: 'characters', label: '캐릭터' },
  { to: 'scenarios', label: '시나리오' },
  { to: 'sessions', label: '세션 기록' },
  { to: 'relations', label: '관계 맵' },
  { to: 'recruitment', label: '구인' },
];

export function GroupShell() {
  const { slug = '' } = useParams<{ slug: string }>();
  const setActiveGroupId = useActiveGroupStore((s) => s.setActiveGroupId);

  // M1.3 에서 slug → group_id 매핑으로 교체.
  useEffect(() => {
    setActiveGroupId(slug || null);
  }, [slug, setActiveGroupId]);

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">그룹</span>
            <span className="font-medium">{slug}</span>
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
          </nav>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
