/**
 * Supabase 스키마 타입.
 *
 * 이 파일은 향후 다음 명령으로 자동 생성하도록 전환한다:
 *   supabase gen types typescript --local > src/app/lib/supabase/database.types.ts
 *
 * 자동 생성으로 전환하기 전에는, supabase/migrations/* 변경에 맞춰 손으로 유지한다.
 * (M1.1 시점 — 0001_init_groups.sql 까지 반영됨)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          discord_user_id: string | null;
          discord_username: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          discord_user_id?: string | null;
          discord_username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          discord_user_id?: string | null;
          discord_username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          visibility: Database['public']['Enums']['group_visibility'];
          is_solo: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          visibility?: Database['public']['Enums']['group_visibility'];
          is_solo?: boolean;
          // 0003 트리거가 auth.uid() 로 자동 세팅 — 클라이언트가 보내지 않는다.
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          visibility?: Database['public']['Enums']['group_visibility'];
          is_solo?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: Database['public']['Enums']['group_role'];
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: Database['public']['Enums']['group_role'];
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['group_role'];
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      group_invitations: {        Row: {
          id: string;
          group_id: string;
          code: string;
          created_by: string;
          max_uses: number;
          uses: number;
          expires_at: string | null;
          default_role: Database['public']['Enums']['group_role'];
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          code: string;
          created_by: string;
          max_uses?: number;
          uses?: number;
          expires_at?: string | null;
          default_role?: Database['public']['Enums']['group_role'];
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          code?: string;
          created_by?: string;
          max_uses?: number;
          uses?: number;
          expires_at?: string | null;
          default_role?: Database['public']['Enums']['group_role'];
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_invitations_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      characters: {
        Row: {
          id: string;
          group_id: string;
          owner_id: string;
          system: Database['public']['Enums']['trpg_system'];
          name: string;
          occupation: string | null;
          status: Database['public']['Enums']['character_status'];
          portrait_url: string | null;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          owner_id?: string;
          system: Database['public']['Enums']['trpg_system'];
          name: string;
          occupation?: string | null;
          status?: Database['public']['Enums']['character_status'];
          portrait_url?: string | null;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          owner_id?: string;
          system?: Database['public']['Enums']['trpg_system'];
          name?: string;
          occupation?: string | null;
          status?: Database['public']['Enums']['character_status'];
          portrait_url?: string | null;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'characters_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_group_member: {
        Args: { p_group_id: string };
        Returns: boolean;
      };
      is_group_admin: {
        Args: { p_group_id: string };
        Returns: boolean;
      };
      peek_invite: {
        Args: { p_code: string };
        Returns: {
          group_id: string;
          group_name: string;
          group_slug: string;
          default_role: Database['public']['Enums']['group_role'];
          expires_at: string | null;
          remaining_uses: number;
        }[];
      };
      redeem_invite: {
        Args: { p_code: string };
        Returns: string;
      };
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_group_rpc: {
        Args: { p_name: string; p_slug: string; p_description?: string | null };
        Returns: Database['public']['Tables']['groups']['Row'];
      };
      whoami: {
        Args: Record<string, never>;
        Returns: Json;
      };
      create_character_rpc: {
        Args: {
          p_group_id: string;
          p_system: Database['public']['Enums']['trpg_system'];
          p_name: string;
          p_occupation?: string | null;
          p_data?: Json;
        };
        Returns: Database['public']['Tables']['characters']['Row'];
      };
    };
    Enums: {
      group_role: 'admin' | 'member' | 'guest';
      group_visibility: 'private' | 'invite_only' | 'public';
      trpg_system: 'coc7' | 'dnd5e' | 'dungeon_world' | 'fiasco' | 'insane' | 'shahonkok' | 'custom';
      character_status: 'active' | 'retired' | 'dead';
    };
    CompositeTypes: Record<string, never>;
  };
};

// 편의 alias — features/* 코드에서 짧게 import.
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type GroupRow = Database['public']['Tables']['groups']['Row'];
export type GroupMemberRow = Database['public']['Tables']['group_members']['Row'];
export type GroupInvitationRow = Database['public']['Tables']['group_invitations']['Row'];
export type CharacterRow = Database['public']['Tables']['characters']['Row'];
export type GroupRole = Database['public']['Enums']['group_role'];
export type GroupVisibility = Database['public']['Enums']['group_visibility'];
export type TrpgSystem = Database['public']['Enums']['trpg_system'];
export type CharacterStatus = Database['public']['Enums']['character_status'];
