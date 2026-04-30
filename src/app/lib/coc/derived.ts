/**
 * CoC 7판 파생 통계 계산.
 *
 * 출처: Call of Cthulhu 7th Edition Keeper Rulebook + 한국어판 (Chaosium / 초여명).
 * 모든 입력은 능력치 1~99 범위. 음수/0 입력은 안전하게 0으로 클램프.
 */

import type { CoCCharacteristics } from './types';

const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

/** Hit Points = (CON + SIZ) / 10 (반올림 내림). */
export function hitPoints(c: CoCCharacteristics): number {
  return Math.floor((clamp(c.CON) + clamp(c.SIZ)) / 10);
}

/** Magic Points = POW / 5. */
export function magicPoints(c: CoCCharacteristics): number {
  return Math.floor(clamp(c.POW) / 5);
}

/** Sanity (시작값) = POW. 시트 표기: "이성 초기치". */
export function sanity(c: CoCCharacteristics): number {
  return clamp(c.POW);
}

/**
 * Sanity 최대치 = 99 - 크툴루 신화 점수.
 * (CoC 7e 공식 룰: Mythos 점수가 SAN cap 을 깎는다.)
 * 시트 셀 BA32 = `99 - 크툴루신화`.
 */
export function maxSanity(mythosTotal: number): number {
  return Math.max(0, 99 - clamp(mythosTotal));
}

/** Dodge = DEX / 2. (별도 기술이지만 기본값은 능력치 파생) */
export function dodgeBase(c: CoCCharacteristics): number {
  return Math.floor(clamp(c.DEX) / 2);
}

/** 모국어(Own Language) 기본값 = EDU. */
export function ownLanguageBase(c: CoCCharacteristics): number {
  return clamp(c.EDU);
}

/**
 * Damage Bonus & Build (체격).
 * STR + SIZ 합계로 결정.
 */
export interface DamageBuild {
  /** 데미지 보너스 다이스 표기 (예: "0", "+1d4", "-1") */
  damageBonus: string;
  /** Build 수치 (-2 ~ +N) */
  build: number;
}

export function damageBuild(c: CoCCharacteristics): DamageBuild {
  const total = clamp(c.STR) + clamp(c.SIZ);
  if (total <= 64) return { damageBonus: '-2', build: -2 };
  if (total <= 84) return { damageBonus: '-1', build: -1 };
  if (total <= 124) return { damageBonus: '0', build: 0 };
  if (total <= 164) return { damageBonus: '+1d4', build: 1 };
  if (total <= 204) return { damageBonus: '+1d6', build: 2 };
  if (total <= 284) return { damageBonus: '+2d6', build: 3 };
  if (total <= 364) return { damageBonus: '+3d6', build: 4 };
  if (total <= 444) return { damageBonus: '+4d6', build: 5 };
  return { damageBonus: '+5d6', build: 6 };
}

/**
 * Move Rate (이동력).
 * 기본: STR/DEX 와 SIZ 비교.
 *  - 둘 다 SIZ 미만: 7
 *  - 둘 다 SIZ 초과: 9
 *  - 그 외: 8
 * 나이 패널티 (40부터 -1, 50: -2, 60: -3, 70: -4, 80+: -5).
 * 최저 1.
 */
export function moveRate(c: CoCCharacteristics, age: number | null | undefined): number {
  const str = clamp(c.STR);
  const dex = clamp(c.DEX);
  const siz = clamp(c.SIZ);
  let mov: number;
  if (str < siz && dex < siz) mov = 7;
  else if (str > siz && dex > siz) mov = 9;
  else mov = 8;

  const a = age ?? 0;
  if (a >= 80) mov -= 5;
  else if (a >= 70) mov -= 4;
  else if (a >= 60) mov -= 3;
  else if (a >= 50) mov -= 2;
  else if (a >= 40) mov -= 1;

  return Math.max(1, mov);
}

/** 모든 파생 통계를 한 번에. */
export interface CoCDerived {
  hp: number;
  mp: number;
  san: number;
  dodge: number;
  ownLanguage: number;
  damageBonus: string;
  build: number;
  mov: number;
}

export function calculateDerived(
  c: CoCCharacteristics,
  age: number | null | undefined,
): CoCDerived {
  const db = damageBuild(c);
  return {
    hp: hitPoints(c),
    mp: magicPoints(c),
    san: sanity(c),
    dodge: dodgeBase(c),
    ownLanguage: ownLanguageBase(c),
    damageBonus: db.damageBonus,
    build: db.build,
    mov: moveRate(c, age),
  };
}

/** 능력치를 굴림에 사용할 때의 단계별 성공값(half/fifth). */
export function successTiers(value: number): { hard: number; extreme: number } {
  return {
    hard: Math.floor(value / 2),
    extreme: Math.floor(value / 5),
  };
}
