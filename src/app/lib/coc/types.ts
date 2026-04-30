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
  /** 키 / 몸무게 — 시트 B11 자유 텍스트 */
  heightWeight?: string | null;
  /** 국적 — 시트 J14 */
  nationality?: string | null;
  /** 시대 — 시트 J15 (예: 현대, 1920년대) */
  era?: string | null;
}

/**
 * 상태 트래커 — 시트 AT33/AW33/AT35/AW35.
 * 게임 중 발생하는 일시 상태. 기본 false.
 */
export interface CoCStatus {
  /** 일시적 광기 */
  temporaryInsanity?: boolean;
  /** 장기적 광기 */
  indefiniteInsanity?: boolean;
  /** 중상 */
  majorWound?: boolean;
  /** 빈사 */
  dying?: boolean;
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

/**
 * 백스토리 항목 — 시트의 B57(겉보기) / S57(성격) / B63(소중한 장소) /
 * B67(이상한 경험) / N67(신화서·주문·유물) / Z67(공포증과 집착증) / AL67(기타 사항)
 * 등을 포함. 7e 표준 9개 + 시트의 추가 2개(tomesAndArtifacts, otherNotes).
 */
export interface CoCBackstory {
  /** 겉보기 — 시트 B57 (외모, 분위기) */
  personalDescription?: string;
  /** 사상·신념 */
  ideologyBeliefs?: string;
  /** 중요한 사람들 */
  significantPeople?: string;
  /** 소중한 장소 — 시트 B63 */
  meaningfulLocations?: string;
  /** 소중한 소유물 */
  treasuredPossessions?: string;
  /** 성격 — 시트 S57 (말버릇, 습관) */
  traits?: string;
  /** 부상과 흉터 */
  injuriesScars?: string;
  /** 공포증과 집착증 — 시트 Z67 */
  phobiasManias?: string;
  /** 이상한 경험 — 시트 B67 (미지의 존재와의 만남) */
  thirdPartyEntities?: string;
  /** 신화서·주문·유물 — 시트 N67 */
  tomesAndArtifacts?: string;
  /** 기타 사항 — 시트 AL67 */
  otherNotes?: string;
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
  status?: CoCStatus;
  /**
   * 세션 중 변동 트래커. null/undefined 면 만피로 간주.
   * 감소하면 그 시점의 값을 저장. '전체 회복' 시 다시 null.
   */
  currentHp?: number | null;
  currentMp?: number | null;
  currentSan?: number | null;
  /**
   * 명장면 / 인상적 순간 — 자유 텍스트, 한 줄당 한 사건 권장.
   * 세션 종료 시 KP·PL 이 의미 있는 순간을 기록. (M5 세션 로그에서 자동 추출 가능 예정)
   */
  memorableMoments?: string;
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
    status: {},
    notes: '',
  };
}
