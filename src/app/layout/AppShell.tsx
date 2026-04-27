import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useActiveGroupStore } from '../features/groups/active-group-store';
import { UserMenu } from './UserMenu';

const globalNav = [
  { to: '/', label: '홈', end: true },
  { to: '/groups', label: '내 그룹' },
];

export function AppShell() {
  const activeGroupId = useActiveGroupStore((s) => s.activeGroupId);
  const location = useLocation();
  const inGroupContext = location.pathname.startsWith('/g/');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-semibold tracking-tight">Uncover Your Tales</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">UYT</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {globalNav.map((item) => (
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
            {!inGroupContext && activeGroupId && (
              <NavLink
                to={`/g/${activeGroupId}`}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-1.5 text-sm transition',
                    isActive
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')
                }
              >
                {activeGroupId}
              </NavLink>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Uncover Your Tales · 친구 그룹 폐쇄 운영 · v0.0.0 (M1.2)
      </footer>
    </div>
  );
}
