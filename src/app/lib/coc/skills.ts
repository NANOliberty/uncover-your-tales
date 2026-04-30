/**
 * CoC 7판 표준 기능 카탈로그.
 *
 * 이름은 docs/coc-sheet-reference.xlsx '원본' 시트 표기를 그대로 따른다.
 * key 는 안정적 식별자 — 한 번 정해지면 데이터 호환을 위해 유지.
 *
 * - base: 기본값 (회피·모국어는 derives 로 능력치 파생)
 * - category: 시트의 시각적 그룹핑이 아닌 우리 분류 (전투/감각/신체/직업/대인/학문/언어/광기)
 * - 표준 외 자작룰 기능은 사용자가 자유 추가 (custom 카테고리)
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
  // 전투 ------------------------------------------------------------
  { key: 'dodge', name: '회피', base: 0, category: '전투', derives: 'dodge' },
  { key: 'fighting_brawl', name: '근접전(격투)', base: 25, category: '전투' },
  { key: 'fighting_sword', name: '근접전(도검)', base: 20, category: '전투' },
  { key: 'fighting_axe', name: '근접전(도끼)', base: 15, category: '전투' },
  { key: 'fighting_spear', name: '근접전(창)', base: 20, category: '전투' },
  { key: 'fighting_whip', name: '근접전(채찍)', base: 5, category: '전투' },
  { key: 'fighting_other', name: '근접전(기타)', base: 10, category: '전투' },
  { key: 'firearms_handgun', name: '사격(권총)', base: 20, category: '전투' },
  { key: 'firearms_rifle', name: '사격(소총)', base: 25, category: '전투' },
  { key: 'firearms_smg', name: '사격(기관단총)', base: 15, category: '전투' },
  { key: 'firearms_mg', name: '사격(기관총)', base: 10, category: '전투' },
  { key: 'firearms_heavy', name: '사격(중화기)', base: 10, category: '전투' },
  { key: 'bow', name: '사격(활)', base: 15, category: '전투' },
  { key: 'flamethrower', name: '화염방사기', base: 10, category: '전투' },
  { key: 'throw', name: '투척', base: 20, category: '전투' },
  { key: 'demolition', name: '폭파', base: 1, category: '전투' },
  { key: 'artillery', name: '포격', base: 1, category: '전투' },

  // 감각 ------------------------------------------------------------
  { key: 'spot_hidden', name: '관찰력', base: 25, category: '감각' },
  { key: 'listen', name: '듣기', base: 20, category: '감각' },
  { key: 'track', name: '추적', base: 10, category: '감각' },

  // 신체 ------------------------------------------------------------
  { key: 'climb', name: '오르기', base: 20, category: '신체' },
  { key: 'jump', name: '도약', base: 20, category: '신체' },
  { key: 'swim', name: '수영', base: 20, category: '신체' },
  { key: 'stealth', name: '은밀행동', base: 20, category: '신체' },
  { key: 'dive', name: '잠수', base: 1, category: '신체' },

  // 직업/기능 -------------------------------------------------------
  { key: 'accounting', name: '회계', base: 5, category: '직업' },
  { key: 'appraise', name: '감정', base: 5, category: '직업' },
  { key: 'art_craft', name: '예술/공예', base: 5, category: '직업' },
  { key: 'animal_handling', name: '동물 다루기', base: 5, category: '직업' },
  { key: 'computer_use', name: '컴퓨터 사용', base: 5, category: '직업' },
  { key: 'disguise', name: '변장', base: 5, category: '직업' },
  { key: 'drive_auto', name: '자동차 운전', base: 20, category: '직업' },
  { key: 'electrical_repair', name: '전기수리', base: 10, category: '직업' },
  { key: 'electronics', name: '전자기기', base: 1, category: '직업' },
  { key: 'first_aid', name: '응급처치', base: 30, category: '직업' },
  { key: 'locksmith', name: '열쇠공', base: 1, category: '직업' },
  { key: 'mech_repair', name: '기계수리', base: 10, category: '직업' },
  { key: 'navigate', name: '항법', base: 10, category: '직업' },
  { key: 'op_heavy_machinery', name: '중장비 조작', base: 1, category: '직업' },
  { key: 'pilot', name: '파일럿', base: 1, category: '직업' },
  { key: 'ride', name: '승마', base: 5, category: '직업' },
  { key: 'sleight_of_hand', name: '손놀림', base: 10, category: '직업' },
  { key: 'survival', name: '생존술', base: 10, category: '직업' },

  // 대인 ------------------------------------------------------------
  { key: 'charm', name: '매혹', base: 15, category: '대인' },
  { key: 'credit_rating', name: '재력', base: 0, category: '대인' },
  { key: 'fast_talk', name: '말재주', base: 5, category: '대인' },
  { key: 'intimidate', name: '위협', base: 15, category: '대인' },
  { key: 'persuade', name: '설득', base: 10, category: '대인' },
  { key: 'psychology', name: '심리학', base: 10, category: '대인' },
  { key: 'read_lips', name: '독순술', base: 1, category: '대인' },

  // 학문 ------------------------------------------------------------
  { key: 'anthropology', name: '인류학', base: 1, category: '학문' },
  { key: 'archaeology', name: '고고학', base: 1, category: '학문' },
  { key: 'history', name: '역사', base: 5, category: '학문' },
  { key: 'law', name: '법률', base: 5, category: '학문' },
  { key: 'library_use', name: '자료조사', base: 20, category: '학문' },
  { key: 'medicine', name: '의료', base: 1, category: '학문' },
  { key: 'natural_world', name: '자연', base: 10, category: '학문' },
  { key: 'occult', name: '오컬트', base: 5, category: '학문' },
  { key: 'psychoanalysis', name: '정신분석', base: 1, category: '학문' },
  { key: 'science', name: '과학', base: 1, category: '학문' },
  { key: 'hypnosis', name: '최면술', base: 1, category: '학문' },
  { key: 'secret_knowledge', name: '비밀 지식', base: 1, category: '학문' },

  // 언어 ------------------------------------------------------------
  { key: 'own_language', name: '모국어', base: 0, category: '언어', derives: 'ownLanguage' },
  { key: 'other_language', name: '외국어', base: 1, category: '언어' },

  // 광기 ------------------------------------------------------------
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
