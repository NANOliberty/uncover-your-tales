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
  name: string;
  /** 최종값 (직업+흥미+기본). 굴림에 그대로 사용. */
  value: number;
  /** 직업 기술인지 — 직업 포인트 분배 표시용 */
  isOccupation?: boolean;
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
