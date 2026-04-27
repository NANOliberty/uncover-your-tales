import { PlaceholderPage } from './PlaceholderPage';

export function GroupsPage() {
  return (
    <PlaceholderPage
      milestone="M1 — 인증 + 그룹"
      title="그룹"
      description="모든 콘텐츠는 그룹에 속합니다. 초대 기반 가입(친구의 친구까지), 멤버 역할 관리, 그룹 단위 디스코드 연동."
      todos={[
        'Discord / Google / Kakao OAuth (Supabase Auth)',
        '그룹 생성 — 이름, 소개, 로고',
        '초대 링크 / 초대 코드',
        '멤버 역할 — 관리자 / 일반 / 게스트',
        '여러 그룹 동시 소속',
        '그룹별 디스코드 서버 연동',
        'RLS — 그룹 멤버만 데이터 접근',
      ]}
    />
  );
}
