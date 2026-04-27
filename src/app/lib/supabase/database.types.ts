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
          created_by: string;
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
    };
    Enums: {
      group_role: 'admin' | 'member' | 'guest';
      group_visibility: 'private' | 'invite_only' | 'public';
    };
    CompositeTypes: Record<string, never>;
  };
};

// 편의 alias — features/* 코드에서 짧게 import.
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type GroupRow = Database['public']['Tables']['groups']['Row'];
export type GroupMemberRow = Database['public']['Tables']['group_members']['Row'];
export type GroupRole = Database['public']['Enums']['group_role'];
export type GroupVisibility = Database['public']['Enums']['group_visibility'];
