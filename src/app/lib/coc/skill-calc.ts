/**
 * 기술 포인트 풀과 합산 계산.
 *
 * - 직업 포인트 풀: 시나리오/직업마다 다르나 표준은 EDU × 4. 사용자가 override 가능.
 * - 흥미 포인트 풀: INT × 2.
 * - 회피/모국어는 능력치 파생 (DEX/2, EDU). 직업·흥미 포인트로 추가 분배 가능.
 */

import type { CoCCharacteristics, CoCSkill } from './types';
import { dodgeBase, ownLanguageBase } from './derived';
import { COC_SKILL_BY_KEY } from './skills';

/** 기술 한 개의 base — 카탈로그 + 능력치 파생을 합쳐 반환. */
export function skillBase(key: string, c: CoCCharacteristics): number {
  const def = COC_SKILL_BY_KEY.get(key);
  if (!def) return 1; // custom 기술은 1 로
  if (def.derives === 'dodge') return dodgeBase(c);
  if (def.derives === 'ownLanguage') return ownLanguageBase(c);
  return def.base;
}

/** 한 기술의 최종값 = base + occupation + interest (99 캡). */
export function skillTotal(skill: CoCSkill, c: CoCCharacteristics): number {
  return Math.min(99, skillBase(skill.key, c) + skill.occupation + skill.interest);
}

export interface SkillPools {
  occupationMax: number;
  interestMax: number;
  occupationUsed: number;
  interestUsed: number;
  /** Math 음수 가능 — 분배 초과 표시용 */
  occupationRemaining: number;
  interestRemaining: number;
}

/** 표준 풀 = EDU × 4 / INT × 2. 향후 직업별 공식이 들어가면 첫 인자 override. */
export function calculatePools(
  c: CoCCharacteristics,
  skills: CoCSkill[],
  occupationFormula?: (c: CoCCharacteristics) => number,
): SkillPools {
  const occupationMax = occupationFormula ? occupationFormula(c) : c.EDU * 4;
  const interestMax = c.INT * 2;
  const occupationUsed = skills.reduce((acc, s) => acc + (s.occupation || 0), 0);
  const interestUsed = skills.reduce((acc, s) => acc + (s.interest || 0), 0);
  return {
    occupationMax,
    interestMax,
    occupationUsed,
    interestUsed,
    occupationRemaining: occupationMax - occupationUsed,
    interestRemaining: interestMax - interestUsed,
  };
}
