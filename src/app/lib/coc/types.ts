/**
 * CoC 7판 캐릭터 데이터 형태.
 *
 * Supabase characters.data jsonb 컬럼에 저장되는 형태.
 * 향후 마이그레이션 위해 v(version) 필드 포함 — 데이터 형태가 바뀌면 v 를 올리고
 * 마이그레이션 헬퍼에서 v1 → v2 변환 로직을 넣는다.
 */

export const COC_DATA_VERSION = 1 as const;

export const COC_CHARACTERISTICS = [
  'STR',
  'CON',
  'SIZ',
  'DEX',
  'APP',
  'INT',
  'POW',
  'EDU',
  'LUCK',
] as const;

export type CoCCharacteristic = (typeof COC_CHARACTERISTICS)[number];

export type CoCCharacteristics = Record<CoCCharacteristic, number>;

export interface CoCInfo {
  age?: number | null;
  gender?: string | null;
  residence?: string | null;
  birthplace?: string | null;
}

export interface CoCSkill {
  /** 표준 기술이면 카탈로그 key, custom 이면 name 그대로 또는 별도 식별자 */
  key: string;
  /** 표시명 (custom 추가 시 필요) */
  name: string;
  /** 직업 포인트로 더해진 양 */
  occupation: number;
  /** 흥미 포인트로 더해진 양 */
  interest: number;
  /** custom 기술 표시용 — 표준 카탈로그에 없을 때 true */
  custom?: boolean;
}

export interface CoCWeapon {
  name: string;
  skill?: string;
  damage?: string;
  range?: string;
  attacks?: string;
  ammo?: string | null;
  malfunction?: string | null;
}

export interface CoCSpell {
  name: string;
  cost?: string;
  effect?: string;
}

export interface CoCInventoryItem {
  name: string;
  qty?: number;
  notes?: string;
}

export interface CoCBackstory {
  personalDescription?: string;
  ideologyBeliefs?: string;
  significantPeople?: string;
  meaningfulLocations?: string;
  treasuredPossessions?: string;
  traits?: string;
  injuriesScars?: string;
  phobiasManias?: string;
  thirdPartyEntities?: string;
}

export interface CoCData {
  v: typeof COC_DATA_VERSION;
  info: CoCInfo;
  characteristics: CoCCharacteristics;
  skills: CoCSkill[];
  weapons: CoCWeapon[];
  spells: CoCSpell[];
  inventory: CoCInventoryItem[];
  backstory: CoCBackstory;
  notes: string;
}

export function emptyCoCData(): CoCData {
  return {
    v: COC_DATA_VERSION,
    info: {},
    characteristics: {
      STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50, LUCK: 50,
    },
    skills: [],
    weapons: [],
    spells: [],
    inventory: [],
    backstory: {},
    notes: '',
  };
}
