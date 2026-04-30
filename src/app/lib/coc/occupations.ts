/**
 * CoC 7판 직업 카탈로그.
 *
 * 출처: docs/coc-sheet-reference.xlsx 의 '원본' 시트 T17 셀 IF-체인.
 * 122개 직업과 각 직업의 직업 점수 풀 공식.
 *
 * 시트 셀 매핑 (검증됨):
 *   V10=STR  V12=CON  V14=SIZ
 *   AD10=DEX AD12=APP AD14=INT
 *   AL10=POW AL12=EDU AL14=LUCK
 */

import type { CoCCharacteristics } from './types';

type PoolFn = (c: CoCCharacteristics) => number;

const F: Record<string, PoolFn> = {
  EDU4: (c) => c.EDU * 4,
  EDU2_APP2: (c) => c.EDU * 2 + c.APP * 2,
  EDU2_DEX2: (c) => c.EDU * 2 + c.DEX * 2,
  EDU2_STR2: (c) => c.EDU * 2 + c.STR * 2,
  EDU2_MAX_STR_DEX: (c) => c.EDU * 2 + Math.max(c.STR * 2, c.DEX * 2),
  EDU2_MAX_DEX_APP: (c) => c.EDU * 2 + Math.max(c.DEX * 2, c.APP * 2),
  EDU2_MAX_APP_POW: (c) => c.EDU * 2 + Math.max(c.APP * 2, c.POW * 2),
  EDU2_MAX_DEX_POW: (c) => c.EDU * 2 + Math.max(c.DEX * 2, c.POW * 2),
  EDU2_MAX_APP_STR_DEX: (c) =>
    c.EDU * 2 + Math.max(c.APP * 2, c.STR * 2, c.DEX * 2),
};

export interface OccupationDef {
  name: string;
  pool: PoolFn;
}

// auto-generated from xlsx — 122 occupations
export const COC_OCCUPATIONS: OccupationDef[] = [
  { name: '간호사', pool: F.EDU4 },
  { name: '갱 보스', pool: F.EDU2_APP2 },
  { name: '건달', pool: F.EDU2_MAX_STR_DEX },
  { name: '건 몰', pool: F.EDU2_APP2 },
  { name: '건축가', pool: F.EDU4 },
  { name: '경관', pool: F.EDU2_MAX_STR_DEX },
  { name: '고고학자', pool: F.EDU4 },
  { name: '곡예사', pool: F.EDU2_DEX2 },
  { name: '골동품상', pool: F.EDU4 },
  { name: '골동품 연구가', pool: F.EDU4 },
  { name: '과학자', pool: F.EDU4 },
  { name: '광부', pool: F.EDU2_MAX_STR_DEX },
  { name: '광신자', pool: F.EDU2_MAX_APP_POW },
  { name: '교수', pool: F.EDU4 },
  { name: '교주', pool: F.EDU2_APP2 },
  { name: '기술자', pool: F.EDU4 },
  { name: '기자', pool: F.EDU4 },
  { name: '깡패', pool: F.EDU2_STR2 },
  { name: '노조 활동가', pool: F.EDU4 },
  { name: '농부', pool: F.EDU2_MAX_STR_DEX },
  { name: '단독 범죄자', pool: F.EDU2_MAX_DEX_APP },
  { name: '대학생', pool: F.EDU4 },
  { name: '도둑', pool: F.EDU2_DEX2 },
  { name: '도박사', pool: F.EDU2_MAX_DEX_APP },
  { name: '등반가', pool: F.EDU2_MAX_STR_DEX },
  { name: '디자이너', pool: F.EDU4 },
  { name: '디프로그래머', pool: F.EDU4 },
  { name: '딜레탕트', pool: F.EDU2_APP2 },
  { name: '떠돌이', pool: F.EDU2_MAX_DEX_APP },
  { name: '리포터', pool: F.EDU4 },
  { name: '매춘부', pool: F.EDU2_APP2 },
  { name: '맹수사냥꾼', pool: F.EDU2_MAX_STR_DEX },
  { name: '미술가', pool: F.EDU2_MAX_DEX_POW },
  { name: '밀수꾼', pool: F.EDU2_MAX_DEX_APP },
  { name: '밀주업자', pool: F.EDU2_STR2 },
  { name: '바텐더', pool: F.EDU2_APP2 },
  { name: '박물관 큐레이터', pool: F.EDU4 },
  { name: '배우', pool: F.EDU2_APP2 },
  { name: '벌목꾼', pool: F.EDU2_MAX_STR_DEX },
  { name: '법의학자', pool: F.EDU4 },
  { name: '변호사', pool: F.EDU4 },
  { name: '병사', pool: F.EDU2_MAX_STR_DEX },
  { name: '병원 보조원', pool: F.EDU2_STR2 },
  { name: '복서/레슬러', pool: F.EDU2_STR2 },
  { name: '부랑자', pool: F.EDU2_MAX_APP_STR_DEX },
  { name: '부족민', pool: F.EDU2_MAX_STR_DEX },
  { name: '부하 조직원', pool: F.EDU2_MAX_STR_DEX },
  { name: '비서', pool: F.EDU2_MAX_DEX_APP },
  { name: '비숙련공', pool: F.EDU2_MAX_STR_DEX },
  { name: '비행사', pool: F.EDU4 },
  { name: '사립탐정', pool: F.EDU2_MAX_STR_DEX },
  { name: '사무원', pool: F.EDU4 },
  { name: '사서', pool: F.EDU4 },
  { name: '사육사', pool: F.EDU4 },
  { name: '사진가', pool: F.EDU4 },
  { name: '사진기자', pool: F.EDU4 },
  { name: '서적상', pool: F.EDU4 },
  { name: '선교사', pool: F.EDU2_APP2 },
  { name: '선원', pool: F.EDU2_MAX_STR_DEX },
  { name: '선출직 공무원', pool: F.EDU2_APP2 },
  { name: '성직자', pool: F.EDU4 },
  { name: '소방관', pool: F.EDU2_MAX_STR_DEX },
  { name: '수병', pool: F.EDU2_MAX_STR_DEX },
  { name: '스턴트맨', pool: F.EDU2_MAX_STR_DEX },
  { name: '스턴트우먼', pool: F.EDU2_MAX_STR_DEX },
  { name: '스파이', pool: F.EDU2_MAX_DEX_APP },
  { name: '신비학자', pool: F.EDU4 },
  { name: '신사/숙녀', pool: F.EDU2_APP2 },
  { name: '심령학자', pool: F.EDU4 },
  { name: '심리학자', pool: F.EDU4 },
  { name: '약사', pool: F.EDU4 },
  { name: '엔지니어', pool: F.EDU4 },
  { name: '연구실 조수', pool: F.EDU4 },
  { name: '연구자', pool: F.EDU4 },
  { name: '연방 요원', pool: F.EDU4 },
  { name: '연예인', pool: F.EDU2_APP2 },
  { name: '연주자', pool: F.EDU2_MAX_DEX_APP },
  { name: '외신 기자', pool: F.EDU4 },
  { name: '운동선수', pool: F.EDU2_MAX_STR_DEX },
  { name: '운전사', pool: F.EDU2_MAX_STR_DEX },
  { name: '웨이터', pool: F.EDU2_MAX_DEX_APP },
  { name: '웨이트리스', pool: F.EDU2_MAX_DEX_APP },
  { name: '위조업자', pool: F.EDU4 },
  { name: '은행강도', pool: F.EDU2_MAX_STR_DEX },
  { name: '의사', pool: F.EDU4 },
  { name: '인턴', pool: F.EDU4 },
  { name: '자객', pool: F.EDU2_MAX_STR_DEX },
  { name: '자연 애호가', pool: F.EDU4 }, // 시트 원본 공식 누락 — EDU*4 로 fallback
  { name: '작가', pool: F.EDU4 },
  { name: '잠수부', pool: F.EDU2_DEX2 },
  { name: '장교', pool: F.EDU2_MAX_STR_DEX },
  { name: '장물아비', pool: F.EDU2_APP2 },
  { name: '장의사', pool: F.EDU4 },
  { name: '장인', pool: F.EDU2_DEX2 },
  { name: '전속 기사', pool: F.EDU2_DEX2 },
  { name: '점장', pool: F.EDU2_MAX_DEX_APP },
  { name: '정신감정사', pool: F.EDU4 },
  { name: '정신과 의사', pool: F.EDU4 },
  { name: '정신병원 직원', pool: F.EDU2_MAX_STR_DEX },
  { name: '정신분석가', pool: F.EDU4 },
  { name: '조련사', pool: F.EDU2_MAX_APP_POW },
  { name: '조종사', pool: F.EDU2_DEX2 },
  { name: '중상급 관리자', pool: F.EDU4 },
  { name: '집사', pool: F.EDU4 },
  { name: '카우걸/카우보이', pool: F.EDU2_MAX_STR_DEX },
  { name: '컴퓨터 테크니션', pool: F.EDU4 },
  { name: '탐광인', pool: F.EDU2_MAX_STR_DEX },
  { name: '탐험가', pool: F.EDU2_MAX_APP_STR_DEX },
  { name: '택시 운전사', pool: F.EDU2_DEX2 },
  { name: '판매원', pool: F.EDU2_APP2 },
  { name: '판사', pool: F.EDU4 },
  { name: '편집자', pool: F.EDU4 },
  { name: '폭력배', pool: F.EDU2_STR2 },
  { name: '프로그래머', pool: F.EDU4 },
  { name: '하녀', pool: F.EDU4 },
  { name: '하인', pool: F.EDU4 },
  { name: '해커', pool: F.EDU4 },
  { name: '현상금 사냥꾼', pool: F.EDU2_MAX_STR_DEX },
  { name: '형사', pool: F.EDU2_MAX_STR_DEX },
  { name: '회계사', pool: F.EDU4 },
  { name: '회사 탐정', pool: F.EDU2_MAX_STR_DEX },
  { name: '기타', pool: F.EDU4 },
];

const OCCUPATION_BY_NAME: Map<string, OccupationDef> = new Map(
  COC_OCCUPATIONS.map((o) => [o.name, o]),
);

/**
 * 직업 이름에 해당하는 직업 점수 풀.
 * - 이름이 카탈로그에 있으면 해당 공식 사용
 * - 자유 입력(자작 직업) 이거나 미입력이면 표준 EDU*4 fallback
 */
export function occupationPool(
  occupation: string | null | undefined,
  c: CoCCharacteristics,
): { value: number; matched: boolean } {
  if (!occupation) return { value: c.EDU * 4, matched: false };
  const def = OCCUPATION_BY_NAME.get(occupation.trim());
  if (def) return { value: def.pool(c), matched: true };
  return { value: c.EDU * 4, matched: false };
}
