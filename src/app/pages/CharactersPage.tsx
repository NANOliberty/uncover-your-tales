import { PlaceholderPage } from './PlaceholderPage';

export function CharactersPage() {
  return (
    <PlaceholderPage
      milestone="M2 — 캐릭터 시트"
      title="캐릭터 시트"
      description="CoC 7판 자동계산 시트 + 그룹 갤러리. 한 시스템을 깊게 만든 뒤 D&D 5e / 던전월드 / 커스텀 빌더로 확장합니다."
      todos={[
        'CoC 7판 시트 — 능력치/기술 자동 계산',
        '코코포리아 채팅팔레트 export (cc<=25 관찰력 형식)',
        '인벤토리 / 주문 / 인물관계 / 백스토리 / 일러스트',
        '그룹 갤러리 — 같은 그룹 멤버 캐릭터 구경',
        '은퇴/사망 상태 + 명장면 기록',
        'PDF / 트위터 카드 export',
      ]}
    />
  );
}
