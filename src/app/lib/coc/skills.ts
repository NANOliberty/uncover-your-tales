/**
 * CoC 7판 표준 기술 카탈로그.
 *
 * - base: 기본값 (능력치 파생인 회피/모국어는 0 으로 두고 derives 를 사용)
 * - category: 시트에서 그룹핑 표시용
 * - 표준 외 자작룰/하우스룰 기술은 사용자가 자유 추가 가능 (custom 카테고리)
 */

export type SkillCategory =
  | '전투'
  | '감각'
  | '신체'
  | '직업'
  | '대인'
  | '학문'
  | '언어'
  | '광기'
  | 'custom';

export interface SkillDef {
  key: string;
  name: string;
  base: number;
  category: SkillCategory;
  /** 특수: 능력치 파생 — base 무시하고 캐릭터 능력치로부터 계산 */
  derives?: 'dodge' | 'ownLanguage';
}

export const COC_STANDARD_SKILLS: SkillDef[] = [
  // 전투
  { key: 'dodge', name: '회피', base: 0, category: '전투', derives: 'dodge' },
  { key: 'fighting_brawl', name: '근접전(격투)', base: 25, category: '전투' },
  { key: 'fighting_sword', name: '근접전(검)', base: 20, category: '전투' },
  { key: 'firearms_handgun', name: '사격(권총)', base: 20, category: '전투' },
  { key: 'firearms_rifle', name: '사격(라이플/산탄총)', base: 25, category: '전투' },
  { key: 'throw', name: '투척', base: 20, category: '전투' },

  // 감각
  { key: 'spot_hidden', name: '관찰력', base: 25, category: '감각' },
  { key: 'listen', name: '듣기', base: 20, category: '감각' },
  { key: 'track', name: '추적', base: 10, category: '감각' },

  // 신체
  { key: 'climb', name: '등반', base: 20, category: '신체' },
  { key: 'jump', name: '점프', base: 20, category: '신체' },
  { key: 'swim', name: '수영', base: 20, category: '신체' },
  { key: 'stealth', name: '은신', base: 20, category: '신체' },

  // 직업/기능
  { key: 'accounting', name: '회계', base: 5, category: '직업' },
  { key: 'appraise', name: '감정', base: 5, category: '직업' },
  { key: 'disguise', name: '변장', base: 5, category: '직업' },
  { key: 'drive_auto', name: '운전(자동차)', base: 20, category: '직업' },
  { key: 'electronics', name: '엘렉트로닉스', base: 1, category: '직업' },
  { key: 'first_aid', name: '응급치료', base: 30, category: '직업' },
  { key: 'locksmith', name: '자물쇠 따기', base: 1, category: '직업' },
  { key: 'mech_repair', name: '기계 수리', base: 10, category: '직업' },
  { key: 'navigate', name: '항법', base: 10, category: '직업' },
  { key: 'op_heavy_machinery', name: '중장비 조작', base: 1, category: '직업' },
  { key: 'pilot', name: '조종', base: 1, category: '직업' },
  { key: 'ride', name: '승마', base: 5, category: '직업' },
  { key: 'sleight_of_hand', name: '소매치기', base: 10, category: '직업' },

  // 대인
  { key: 'charm', name: '매혹', base: 15, category: '대인' },
  { key: 'credit_rating', name: '신용', base: 0, category: '대인' },
  { key: 'fast_talk', name: '빠른 말', base: 5, category: '대인' },
  { key: 'intimidate', name: '위협', base: 15, category: '대인' },
  { key: 'persuade', name: '설득', base: 10, category: '대인' },
  { key: 'psychology', name: '심리학', base: 10, category: '대인' },

  // 학문
  { key: 'anthropology', name: '인류학', base: 1, category: '학문' },
  { key: 'archaeology', name: '고고학', base: 1, category: '학문' },
  { key: 'history', name: '역사', base: 5, category: '학문' },
  { key: 'law', name: '법률', base: 5, category: '학문' },
  { key: 'library_use', name: '도서관 이용', base: 20, category: '학문' },
  { key: 'medicine', name: '의학', base: 1, category: '학문' },
  { key: 'natural_world', name: '자연사', base: 10, category: '학문' },
  { key: 'occult', name: '오컬트', base: 5, category: '학문' },
  { key: 'psychoanalysis', name: '정신분석', base: 1, category: '학문' },
  { key: 'science', name: '과학', base: 1, category: '학문' },

  // 언어
  { key: 'own_language', name: '모국어', base: 0, category: '언어', derives: 'ownLanguage' },
  { key: 'other_language', name: '외국어', base: 1, category: '언어' },

  // 광기 (게임 진행 중에 증가)
  { key: 'cthulhu_mythos', name: '크툴루 신화', base: 0, category: '광기' },
];

/** key → SkillDef. 빠른 조회용. */
export const COC_SKILL_BY_KEY: Map<string, SkillDef> = new Map(
  COC_STANDARD_SKILLS.map((s) => [s.key, s]),
);

export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
  '전투',
  '감각',
  '신체',
  '직업',
  '대인',
  '학문',
  '언어',
  '광기',
  'custom',
];
