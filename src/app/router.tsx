import { createBrowserRouter } from 'react-router';
import { AppShell } from './layout/AppShell';
import { HomePage } from './pages/HomePage';
import { CharactersPage } from './pages/CharactersPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { SessionsPage } from './pages/SessionsPage';
import { RelationsPage } from './pages/RelationsPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { GroupsPage } from './pages/GroupsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    children: [
      { index: true, Component: HomePage },
      { path: 'characters', Component: CharactersPage },
      { path: 'scenarios', Component: ScenariosPage },
      { path: 'sessions', Component: SessionsPage },
      { path: 'relations', Component: RelationsPage },
      { path: 'recruitment', Component: RecruitmentPage },
      { path: 'groups', Component: GroupsPage },
    ],
  },
]);
