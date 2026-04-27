/**
 * Supabase 생성 타입 placeholder.
 *
 * M1에서 Supabase CLI 로 실제 스키마를 만들고 다음 명령으로 자동 생성합니다:
 *   supabase gen types typescript --local > src/app/lib/supabase/database.types.ts
 *
 * 그때까지는 빈 스키마로 두어 타입 체크만 통과시킵니다.
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
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};
