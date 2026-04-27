/**
 * UYT 도메인 타입.
 *
 * Supabase 스키마는 M1 에서 확정되며, 그 시점에 `database.types.ts`를 자동 생성하고
 * 이 파일은 거기서 추출한 Row 타입을 alias 하는 식으로 정리합니다.
 * 지금은 features/* 가 컴파일될 수 있도록 하는 최소한의 형태만 둡니다.
 */

export type GroupRole = 'admin' | 'member' | 'guest';
export type GroupVisibility = 'private' | 'invite_only' | 'public';

export type TrpgSystem =
  | 'coc7'
  | 'dnd5e'
  | 'dungeon_world'
  | 'fiasco'
  | 'insane'
  | 'shahonkok'
  | 'custom';

export type ContentVisibility = 'group' | 'members' | 'private';

export interface User {
  id: string;
  displayName: string;
  bio: string | null;
  discordUserId: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  visibility: GroupVisibility; // (c) 확장 대비 — 지금은 invite_only 만 활성
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
}

export interface CharacterSummary {
  id: string;
  groupId: string;
  ownerId: string;
  system: TrpgSystem;
  name: string;
  occupation: string | null;
  portraitUrl: string | null;
  status: 'active' | 'retired' | 'dead';
  updatedAt: string;
}

export interface ScenarioSummary {
  id: string;
  groupId: string;
  title: string;
  system: TrpgSystem;
  authorName: string | null;
  recommendedPlayers: string | null;
  triggerWarnings: string[];
  sessionRunCount: number;
  updatedAt: string;
}

export interface SessionRunSummary {
  id: string;
  groupId: string;
  scenarioId: string | null;
  scenarioTitle: string;
  gmId: string;
  startedAt: string;
  endedAt: string | null;
}
