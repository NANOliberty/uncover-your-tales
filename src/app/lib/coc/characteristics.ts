import type { CoCCharacteristic } from './types';

/**
 * 능력치 한국어 라벨과 영문 풀네임.
 * (참조: docs/coc-sheet-reference.xlsx 의 '원본' 시트 표기)
 */
export const COC_LABELS: Record<CoCCharacteristic, { ko: string; en: string }> = {
  STR: { ko: '근력', en: 'Strength' },
  CON: { ko: '건강', en: 'Constitution' },
  SIZ: { ko: '크기', en: 'Size' },
  DEX: { ko: '민첩', en: 'Dexterity' },
  APP: { ko: '외모', en: 'Appearance' },
  INT: { ko: '지능', en: 'Intelligence' },
  POW: { ko: '정신', en: 'Power' },
  EDU: { ko: '교육', en: 'Education' },
  LUCK: { ko: '행운', en: 'Luck' },
};

/** 시트 그리드 표시 순서 (3열). */
export const COC_GRID_ORDER: CoCCharacteristic[] = [
  'STR', 'DEX', 'INT',
  'CON', 'APP', 'POW',
  'SIZ', 'EDU', 'LUCK',
];
