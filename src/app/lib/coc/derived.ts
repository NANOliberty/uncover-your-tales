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

/**
 * 재력(Credit Rating) 점수에 따른 생활 수준·소비·현금·자산.
 * 시트 W63/AA63/AE63 의 if-체인을 그대로 옮긴 형태.
 *
 * 주의: 시트는 *1.3 으로 약간 곱해 표기 — 한국어판 환산 가산 정도.
 * 우리도 동일하게 따라 사용자가 본 숫자와 일치하게 한다.
 */
export type WealthLevel = 'destitute' | 'poor' | 'average' | 'wealthy' | 'rich' | 'super_rich';

export interface CoCWealth {
  level: WealthLevel;
  /** 한국어판 시트 표기 한 줄 묘사 */
  description: string;
  spendingLevel: number;
  cash: number;
  /** 99 면 "$100,000,000+" 표기, 그 외엔 숫자 */
  assets: number | string;
}

const W = (n: number) => Math.round(n * 1.3);

export function calculateWealth(creditRating: number): CoCWealth {
  const r = Number.isFinite(creditRating) ? Math.max(0, Math.floor(creditRating)) : 0;
  if (r === 0)
    return {
      level: 'destitute',
      description: '무일푼, 노숙',
      spendingLevel: W(10),
      cash: W(10),
      assets: 0,
    };
  if (r <= 9)
    return {
      level: 'poor',
      description: '가난, 최소한의 재산만 소유',
      spendingLevel: W(40),
      cash: W(r * 20),
      assets: W(r * 200),
    };
  if (r <= 49)
    return {
      level: 'average',
      description: '보통, 적당히 안락한 생활',
      spendingLevel: W(200),
      cash: W(r * 40),
      assets: W(r * 1000),
    };
  if (r <= 89)
    return {
      level: 'wealthy',
      description: '부유, 약간의 사치 가능',
      spendingLevel: W(1000),
      cash: W(r * 100),
      assets: W(r * 10000),
    };
  if (r <= 98)
    return {
      level: 'rich',
      description: '자산가, 막대한 부와 사치',
      spendingLevel: W(5000),
      cash: W(r * 400),
      assets: W(r * 40000),
    };
  return {
    level: 'super_rich',
    description: '갑부, 돈은 문제가 되지 않는 수준',
    spendingLevel: 100000,
    cash: W(1000000),
    assets: '$100,000,000+',
  };
}
