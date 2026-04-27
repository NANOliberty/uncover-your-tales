import { createBrowserRouter } from 'react-router';
import { AppShell } from './layout/AppShell';
import { RequireAuth } from './features/auth/RequireAuth';
import { HomePage } from './pages/HomePage';
import { GroupsPage } from './pages/GroupsPage';
import { CharactersPage } from './pages/CharactersPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { SessionsPage } from './pages/SessionsPage';
import { RelationsPage } from './pages/RelationsPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { AuthLoginPage } from './pages/AuthLoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { GroupShell } from './layout/GroupShell';

/**
 * 라우트 구조
 *
 *   /                     공개 — 랜딩
 *   /auth/login           공개 — 로그인
 *   /auth/callback        공개 — OAuth 콜백
 *
 *   <RequireAuth>
 *     /groups             내 그룹 목록 (그룹 미선택 상태의 허브)
 *     /g/:slug            <GroupShell> — 그룹 컨텍스트
 *       characters        그룹 캐릭터
 *       scenarios         그룹 시나리오
 *       sessions          그룹 세션 기록
 *       relations         그룹 관계 맵
 *       recruitment       그룹 구인
 *
 * 그룹 컨텍스트 페이지는 항상 URL 에 slug 가 박혀있어 공유성이 좋고
 * 멀티 그룹 소속에서 어느 그룹을 보고 있는지 모호하지 않다.
 */
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
            ],
          },
        ],
      },
    ],
  },
]);
