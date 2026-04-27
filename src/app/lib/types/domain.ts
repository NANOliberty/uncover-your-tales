/**
 * UYT 도메인 타입(앱 representation).
 *
 * DB Row 는 snake_case 이고 `database.types.ts` 에 있다.
 * 이 파일은 그것을 mapper 로 변환한 뒤의 camelCase 모양이다.
 * features/* 의 hook / component 가 들고 다니는 타입.
 */

export type { GroupRole, GroupVisibility } from '../supabase/database.types';

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
