import { PlaceholderPage } from './PlaceholderPage';

export function RelationsPage() {
  return (
    <PlaceholderPage
      milestone="M6 — 캐릭터 관계 맵"
      title="관계 맵"
      description="그룹 단위 캐릭터 간 관계를 React Flow 로 시각화. 같은 SessionRun 참여 시 약한 연결이 자동 생성되고, 사용자가 직접 라벨을 붙일 수 있습니다."
      todos={[
        '비대칭 directed 관계 (A→B 신뢰, B→A 이용 중)',
        'SessionRun 참여로 인한 자동 약한 연결',
        '사용자 정의 라벨 — 라이벌, 빚, 연인 등',
        '시점 토글 — 세션1 시점 / 현재 등',
        '그래프 + 표 뷰 둘 다',
      ]}
    />
  );
}
