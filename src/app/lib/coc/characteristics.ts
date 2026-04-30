import type { CoCCharacteristic } from './types';

/**
 * 특성치 한국어 라벨 + 영문 풀네임 + 한국 TRPG 커뮤니티의 흔한 별칭.
 * (참조: docs/coc-sheet-reference.xlsx 의 '원본' 시트 표기)
 *
 * 별칭(alt): INT 는 일반 상식 굴림에서 '아이디어 굴림' 으로,
 * EDU 는 학문/지식 굴림에서 '지식 굴림' 으로 자주 호명됨.
 */
export const COC_LABELS: Record<CoCCharacteristic, { ko: string; en: string; alt?: string }> = {
  STR: { ko: '근력', en: 'Strength' },
  CON: { ko: '건강', en: 'Constitution' },
  SIZ: { ko: '크기', en: 'Size' },
  DEX: { ko: '민첩', en: 'Dexterity' },
  APP: { ko: '외모', en: 'Appearance' },
  INT: { ko: '지능', en: 'Intelligence', alt: '아이디어' },
  POW: { ko: '정신', en: 'Power' },
  EDU: { ko: '교육', en: 'Education', alt: '지식' },
  LUCK: { ko: '행운', en: 'Luck' },
};

/** 표시용 라벨 한 줄 — 별칭이 있으면 "지능 (아이디어)" 식으로. */
export function fullLabel(code: CoCCharacteristic): string {
  const l = COC_LABELS[code];
  return l.alt ? `${l.ko} (${l.alt})` : l.ko;
}

/** 시트 그리드 표시 순서 (3열). */
export const COC_GRID_ORDER: CoCCharacteristic[] = [
  'STR', 'DEX', 'INT',
  'CON', 'APP', 'POW',
  'SIZ', 'EDU', 'LUCK',
];
