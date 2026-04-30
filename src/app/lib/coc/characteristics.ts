import type { CoCCharacteristic } from './types';

/**
 * 능력치 한국어 라벨과 영문 풀네임.
 */
export const COC_LABELS: Record<CoCCharacteristic, { ko: string; en: string }> = {
  STR: { ko: '근력', en: 'Strength' },
  CON: { ko: '체력', en: 'Constitution' },
  SIZ: { ko: '덩치', en: 'Size' },
  DEX: { ko: '민첩', en: 'Dexterity' },
  APP: { ko: '외모', en: 'Appearance' },
  INT: { ko: '지능', en: 'Intelligence' },
  POW: { ko: '정신력', en: 'Power' },
  EDU: { ko: '교육', en: 'Education' },
  LUCK: { ko: '운', en: 'Luck' },
};

/** 시트 그리드 표시 순서 (3열). */
export const COC_GRID_ORDER: CoCCharacteristic[] = [
  'STR', 'DEX', 'INT',
  'CON', 'APP', 'POW',
  'SIZ', 'EDU', 'LUCK',
];
