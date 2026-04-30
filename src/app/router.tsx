import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './layout/AppShell';
import { RequireAuth } from './features/auth/RequireAuth';
import { HomePage } from './pages/HomePage';
import { GroupsPage } from './pages/GroupsPage';
import { CreateGroupPage } from './pages/CreateGroupPage';
import { JoinGroupPage } from './pages/JoinGroupPage';
import { GroupSettingsPage } from './pages/GroupSettingsPage';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterNewPage } from './pages/CharacterNewPage';
import { CharacterDetailPage } from './pages/CharacterDetailPage';
import { CharacterEditPage } from './pages/CharacterEditPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { SessionsPage } from './pages/SessionsPage';
import { RelationsPage } from './pages/RelationsPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { AuthLoginPage } from './pages/AuthLoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { GroupShell } from './layout/GroupShell';
import { RouteErrorBoundary } from './layout/RouteErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, Component: HomePage },
      { path: 'auth/login', Component: AuthLoginPage },
      { path: 'auth/callback', Component: AuthCallbackPage },
      {
        Component: RequireAuth,
        children: [
          { path: 'groups', Component: GroupsPage },
          { path: 'groups/new', Component: CreateGroupPage },
          { path: 'groups/join', Component: JoinGroupPage },
          {
            path: 'g/:slug',
            Component: GroupShell,
            children: [
              // /g/:slug 진입 시 /g/:slug/characters 로 항상 리다이렉트.
              // 그래야 자식 페이지에서의 상대 경로 (예: <Link to="new">) 가 항상
              // /characters/new 로 풀린다.
              { index: true, element: <Navigate to="characters" replace /> },
              { path: 'characters', Component: CharactersPage },
              { path: 'characters/new', Component: CharacterNewPage },
              { path: 'characters/:characterId', Component: CharacterDetailPage },
              { path: 'characters/:characterId/edit', Component: CharacterEditPage },
              { path: 'scenarios', Component: ScenariosPage },
              { path: 'sessions', Component: SessionsPage },
              { path: 'relations', Component: RelationsPage },
              { path: 'recruitment', Component: RecruitmentPage },
              { path: 'settings', Component: GroupSettingsPage },
            ],
          },
        ],
      },
    ],
  },
]);
