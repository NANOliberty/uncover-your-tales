import { NavLink, Outlet } from 'react-router';
import { useActiveGroupStore } from '../features/groups/active-group-store';

const nav = [
  { to: '/', label: '홈', end: true },
  { to: '/characters', label: '캐릭터' },
  { to: '/scenarios', label: '시나리오' },
  { to: '/sessions', label: '세션 기록' },
  { to: '/relations', label: '관계 맵' },
  { to: '/recruitment', label: '구인' },
  { to: '/groups', label: '그룹' },
];

export function AppShell() {
  const activeGroupId = useActiveGroupStore((s) => s.activeGroupId);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <NavLink to="/" className="flex items-baseline gap-2">
            <span className="font-semibold tracking-tight">Uncover Your Tales</span>
            <span className="text-xs text-muted-foreground">UYT</span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-1.5 text-sm transition',
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

          <div className="ml-auto flex items-center gap-3">
            <GroupSwitcher activeGroupId={activeGroupId} />
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t px-3 py-1.5 md:hidden">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-md px-3 py-1 text-sm',
                  isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Uncover Your Tales · 친구 그룹 폐쇄 운영 · v0.0.0 (M0 scaffold)
      </footer>
    </div>
  );
}

function GroupSwitcher({ activeGroupId }: { activeGroupId: string | null }) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
      <span className="text-muted-foreground">그룹</span>
      <span className="font-medium">{activeGroupId ?? '미선택'}</span>
    </div>
  );
}
