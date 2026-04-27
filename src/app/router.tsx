import { createBrowserRouter } from 'react-router';
import { AppShell } from './layout/AppShell';
import { RequireAuth } from './features/auth/RequireAuth';
import { HomePage } from './pages/HomePage';
import { GroupsPage } from './pages/GroupsPage';
import { CreateGroupPage } from './pages/CreateGroupPage';
import { JoinGroupPage } from './pages/JoinGroupPage';
import { GroupSettingsPage } from './pages/GroupSettingsPage';
import { CharactersPage } from './pages/CharactersPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { SessionsPage } from './pages/SessionsPage';
import { RelationsPage } from './pages/RelationsPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { AuthLoginPage } from './pages/AuthLoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { GroupShell } from './layout/GroupShell';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
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
              { index: true, Component: CharactersPage },
              { path: 'characters', Component: CharactersPage },
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
