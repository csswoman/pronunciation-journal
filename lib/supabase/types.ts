/** Tipos generados a mano para la tabla `public.entries` (ajusta si cambias el esquema). */
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
      entries: {
        Row: {
          id: string;
          user_id: string;
          word: string;
          ipa: string | null;
          audio_url: string | null;
          user_audio_url: string | null;
          notes: string | null;
          difficulty: string;
          tags: string[] | null;
          meanings: Json | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          word: string;
          ipa?: string | null;
          audio_url?: string | null;
          user_audio_url?: string | null;
          notes?: string | null;
          difficulty: string;
          tags?: string[] | null;
          meanings?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          word?: string;
          ipa?: string | null;
          audio_url?: string | null;
          user_audio_url?: string | null;
          notes?: string | null;
          difficulty?: string;
          tags?: string[] | null;
          meanings?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
