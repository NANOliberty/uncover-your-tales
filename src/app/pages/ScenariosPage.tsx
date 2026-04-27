import { PlaceholderPage } from './PlaceholderPage';

export function ScenariosPage() {
  return (
    <PlaceholderPage
      milestone="M3 — 시나리오 / SessionRun"
      title="시나리오"
      description="Scenario(불변 자산) 와 SessionRun(실제 굴려진 세션) 을 분리하는 핵심 데이터 모델. 같은 시나리오로 여러 번 진행해도 각각 독립 기록이 남습니다."
      todos={[
        'Scenario CRUD — 작가, 시스템, 인원, 추천, 핸드아웃',
        '트리거 워닝 태그',
        '스포일러 가림 — 미플레이자 자동 블러',
        'GM 전용 비공개 영역 (NPC 스탯, 분기)',
        '그룹 내 공유 / 무료 외부 공유 토글 (외부 공유는 (c) 확장 시점)',
        '시나리오 페이지에서 SessionRun 역참조',
      ]}
    />
  );
}
