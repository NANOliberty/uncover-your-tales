import { PlaceholderPage } from './PlaceholderPage';

export function RecruitmentPage() {
  return (
    <PlaceholderPage
      milestone="M4 — 구인구직 + 일정 매칭"
      title="구인구직"
      description="그룹 멤버 대상 PL/GM 모집과 when2meet 스타일 일정 슬롯."
      todos={[
        '모집글 — 정기/단발/캠페인',
        'when2meet 스타일 슬롯 + 타임존 처리',
        '반복 일정 — 정기 캠페인 (매주 토요일 8시 등)',
        '차회차 자동 폴 — 이전 회차 참여자만',
        '신청 카드 — 자기소개 + 캐릭터 시트 첨부',
        '마감 후 디스코드 채널 자동 생성 / 초대링크 발송',
        '게스트 초대 (그룹 외부 친구를 특정 세션에만)',
      ]}
    />
  );
}
