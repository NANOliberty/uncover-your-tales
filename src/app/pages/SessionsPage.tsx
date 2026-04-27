import { PlaceholderPage } from './PlaceholderPage';

export function SessionsPage() {
  return (
    <PlaceholderPage
      milestone="M5 — 세션 후 기록"
      title="세션 기록"
      description="사이트의 메인 콘텐츠. 그룹 데이터로 쌓이면서 우리만의 아카이브가 됩니다."
      todos={[
        '코코포리아 / Roll20 / 디스코드 로그 붙여넣기 → 정규화',
        '회차별 요약, 명장면, 인용구',
        '다이스 명장면 (1펌블 / 100크리티컬) 박제',
        'GM 후기 / PL 후기 분리',
        'Campaign → SessionRun → Episode 3층 구조',
        '권한 — 그룹 / 참여자 / 비공개',
      ]}
    />
  );
}
