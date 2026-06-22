export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      assessment_results: {
        Row: {
          assigned_level: string
          completed_at: string
          evaluated_level: string | null
          id: string
          mode: string
          passed: boolean
          score: number
          topic_scores: Json
          total: number
          user_id: string
        }
        Insert: {
          assigned_level: string
          completed_at?: string
          evaluated_level?: string | null
          id?: string
          mode: string
          passed: boolean
          score: number
          topic_scores?: Json
          total: number
          user_id: string
        }
        Update: {
          assigned_level?: string
          completed_at?: string
          evaluated_level?: string | null
          id?: string
          mode?: string
          passed?: boolean
          score?: number
          topic_scores?: Json
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_prompts: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_system: boolean | null
          label: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          label?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          label?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      answer_history: {
        Row: {
          answered_at: string | null
          content_id: string | null
          context: string | null
          exercise_payload: Json | null
          exercise_type_id: number
          grade: number | null
          id: string
          is_correct: boolean
          sound_id: number | null
          target_word: string | null
          time_ms: number | null
          user_answer: string | null
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          content_id?: string | null
          context?: string | null
          exercise_payload?: Json | null
          exercise_type_id: number
          grade?: number | null
          id?: string
          is_correct: boolean
          sound_id?: number | null
          target_word?: string | null
          time_ms?: number | null
          user_answer?: string | null
          user_id: string
        }
        Update: {
          answered_at?: string | null
          content_id?: string | null
          context?: string | null
          exercise_payload?: Json | null
          exercise_type_id?: number
          grade?: number | null
          id?: string
          is_correct?: boolean
          sound_id?: number | null
          target_word?: string | null
          time_ms?: number | null
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ah_sound_fk"
            columns: ["sound_id"]
            isOneToOne: false
            referencedRelation: "sounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_history_exercise_type_fk"
            columns: ["exercise_type_id"]
            isOneToOne: false
            referencedRelation: "exercise_types"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_sessions: {
        Row: {
          id: string
          user_id: string
          source: string
          practice_context: string | null
          skill_tags: string[]
          exercises_total: number
          exercises_correct: number
          accuracy_pct: number
          duration_ms: number
          xp_earned: number
          reconciled_step_ids: string[]
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source: string
          practice_context?: string | null
          skill_tags?: string[]
          exercises_total?: number
          exercises_correct?: number
          accuracy_pct?: number
          duration_ms?: number
          xp_earned?: number
          reconciled_step_ids?: string[]
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: string
          practice_context?: string | null
          skill_tags?: string[]
          exercises_total?: number
          exercises_correct?: number
          accuracy_pct?: number
          duration_ms?: number
          xp_earned?: number
          reconciled_step_ids?: string[]
          completed_at?: string
          created_at?: string
        }
        Relationships: []
      }
      deck_entries: {
        Row: {
          added_at: string | null
          deck_id: string
          entry_id: string
        }
        Insert: {
          added_at?: string | null
          deck_id: string
          entry_id: string
        }
        Update: {
          added_at?: string | null
          deck_id?: string
          entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_entries_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_entries_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_entry_progress: {
        Row: {
          created_at: string
          ease_factor: number
          entry_id: string
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string
          repetitions: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ease_factor?: number
          entry_id: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ease_factor?: number
          entry_id?: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_entry_progress_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_suggestions_cache: {
        Row: {
          cache_key: string
          created_at: string
          id: string
          suggestions: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          id?: string
          suggestions: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          id?: string
          suggestions?: Json
        }
        Relationships: []
      }
      decks: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          audio_url: string | null
          created_at: string
          difficulty: number
          id: string
          image_url: string | null
          ipa: string | null
          keep_permanent: boolean
          meanings: Json | null
          notes: string | null
          phrases: string[] | null
          sound_id: number | null
          tags: string[] | null
          updated_at: string | null
          user_audio_url: string | null
          user_id: string
          word: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          difficulty: number
          id: string
          image_url?: string | null
          ipa?: string | null
          keep_permanent?: boolean
          meanings?: Json | null
          notes?: string | null
          phrases?: string[] | null
          sound_id?: number | null
          tags?: string[] | null
          updated_at?: string | null
          user_audio_url?: string | null
          user_id: string
          word: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          difficulty?: number
          id?: string
          image_url?: string | null
          ipa?: string | null
          keep_permanent?: boolean
          meanings?: Json | null
          notes?: string | null
          phrases?: string[] | null
          sound_id?: number | null
          tags?: string[] | null
          updated_at?: string | null
          user_audio_url?: string | null
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_sound_fk"
            columns: ["sound_id"]
            isOneToOne: false
            referencedRelation: "sounds"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_types: {
        Row: {
          id: number
          label: string
          slug: string
        }
        Insert: {
          id?: number
          label: string
          slug: string
        }
        Update: {
          id?: number
          label?: string
          slug?: string
        }
        Relationships: []
      }
      minimal_pairs: {
        Row: {
          contrast_ipa_a: string | null
          contrast_ipa_b: string | null
          contrast_sound_a_id: number | null
          contrast_sound_b_id: number | null
          id: number
          ipa_a: string | null
          ipa_b: string | null
          sound_a_id: number | null
          sound_b_id: number | null
          sound_group: string | null
          word_a: string | null
          word_b: string | null
        }
        Insert: {
          contrast_ipa_a?: string | null
          contrast_ipa_b?: string | null
          contrast_sound_a_id?: number | null
          contrast_sound_b_id?: number | null
          id?: number
          ipa_a?: string | null
          ipa_b?: string | null
          sound_a_id?: number | null
          sound_b_id?: number | null
          sound_group?: string | null
          word_a?: string | null
          word_b?: string | null
        }
        Update: {
          contrast_ipa_a?: string | null
          contrast_ipa_b?: string | null
          contrast_sound_a_id?: number | null
          contrast_sound_b_id?: number | null
          id?: number
          ipa_a?: string | null
          ipa_b?: string | null
          sound_a_id?: number | null
          sound_b_id?: number | null
          sound_group?: string | null
          word_a?: string | null
          word_b?: string | null
        }
        Relationships: []
      }
      pattern_words: {
        Row: {
          id: number
          ipa: string | null
          pattern_id: number | null
          word: string | null
        }
        Insert: {
          id?: number
          ipa?: string | null
          pattern_id?: number | null
          word?: string | null
        }
        Update: {
          id?: number
          ipa?: string | null
          pattern_id?: number | null
          word?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_words_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      patterns: {
        Row: {
          id: number
          pattern: string | null
          sound_focus: string | null
          type: string | null
        }
        Insert: {
          id?: number
          pattern?: string | null
          sound_focus?: string | null
          type?: string | null
        }
        Update: {
          id?: number
          pattern?: string | null
          sound_focus?: string | null
          type?: string | null
        }
        Relationships: []
      }
      sounds: {
        Row: {
          category: string | null
          difficulty: number | null
          example: string | null
          id: number
          ipa: string | null
          type: string | null
        }
        Insert: {
          category?: string | null
          difficulty?: number | null
          example?: string | null
          id?: number
          ipa?: string | null
          type?: string | null
        }
        Update: {
          category?: string | null
          difficulty?: number | null
          example?: string | null
          id?: number
          ipa?: string | null
          type?: string | null
        }
        Relationships: []
      }
      stt_transcription_cache: {
        Row: {
          cache_key: string
          created_at: string
          hit_count: number
          mime_type: string
          payload_size: number
          target_word: string | null
          transcript: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          hit_count?: number
          mime_type: string
          payload_size?: number
          target_word?: string | null
          transcript: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          hit_count?: number
          mime_type?: string
          payload_size?: number
          target_word?: string | null
          transcript?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      text_fragments: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string | null
          fragment_type: string | null
          id: string
          source: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string | null
          fragment_type?: string | null
          id?: string
          source?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string | null
          fragment_type?: string | null
          id?: string
          source?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      theory_lessons: {
        Row: {
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          id: string
          is_published: boolean
          is_system: boolean
          slug: string
          source: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          is_system?: boolean
          slug: string
          source?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          is_system?: boolean
          slug?: string
          source?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_favorite_prompts: {
        Row: {
          prompt_id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          prompt_id: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          prompt_id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_prompts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          cefr_level: string
          created_at: string | null
          display_name: string | null
          id: string
          role: string | null
          storage_used_kb: number | null
        }
        Insert: {
          cefr_level?: string
          created_at?: string | null
          display_name?: string | null
          id: string
          role?: string | null
          storage_used_kb?: number | null
        }
        Update: {
          cefr_level?: string
          created_at?: string | null
          display_name?: string | null
          id?: string
          role?: string | null
          storage_used_kb?: number | null
        }
        Relationships: []
      }
      user_learning_state: {
        Row: {
          user_id: string
          state: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          state: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          state?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_contrast_progress: {
        Row: {
          contrast_id: string
          correct_answers: number
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_seen: string | null
          next_review: string | null
          streak: number
          total_attempts: number
          mastery_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contrast_id: string
          correct_answers?: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_seen?: string | null
          next_review?: string | null
          streak?: number
          total_attempts?: number
          mastery_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contrast_id?: string
          correct_answers?: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_seen?: string | null
          next_review?: string | null
          streak?: number
          total_attempts?: number
          mastery_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      word_bank: {
        Row: {
          audio_fetch_attempts: number
          audio_url: string | null
          context: string | null
          created_at: string
          difficulty: number
          ease_factor: number
          error_reason: string | null
          example: string | null
          has_audio: boolean | null
          id: string
          image_prompt: string | null
          interval_days: number
          ipa: string | null
          last_reviewed_at: string | null
          meaning: string | null
          next_review_at: string | null
          repetitions: number
          review_count: number
          source: string | null
          source_ref: string | null
          srs_status: string
          status: string
          synonyms: string[] | null
          text: string
          translation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_fetch_attempts?: number
          audio_url?: string | null
          context?: string | null
          created_at?: string
          difficulty?: number
          ease_factor?: number
          error_reason?: string | null
          example?: string | null
          has_audio?: boolean | null
          id?: string
          image_prompt?: string | null
          interval_days?: number
          ipa?: string | null
          last_reviewed_at?: string | null
          meaning?: string | null
          next_review_at?: string | null
          repetitions?: number
          review_count?: number
          source?: string | null
          source_ref?: string | null
          srs_status?: string
          status?: string
          synonyms?: string[] | null
          text: string
          translation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_fetch_attempts?: number
          audio_url?: string | null
          context?: string | null
          created_at?: string
          difficulty?: number
          ease_factor?: number
          error_reason?: string | null
          example?: string | null
          has_audio?: boolean | null
          id?: string
          image_prompt?: string | null
          interval_days?: number
          ipa?: string | null
          last_reviewed_at?: string | null
          meaning?: string | null
          next_review_at?: string | null
          repetitions?: number
          review_count?: number
          source?: string | null
          source_ref?: string | null
          srs_status?: string
          status?: string
          synonyms?: string[] | null
          text?: string
          translation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      word_bank_decks: {
        Row: {
          added_at: string
          deck_id: string
          word_id: string
        }
        Insert: {
          added_at?: string
          deck_id: string
          word_id: string
        }
        Update: {
          added_at?: string
          deck_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_bank_decks_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_bank_decks_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "word_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          audio_url: string | null
          difficulty: number | null
          id: number
          ipa: string | null
          phonemes: Json | null
          sound_focus: string | null
          sound_id: number | null
          word: string | null
        }
        Insert: {
          audio_url?: string | null
          difficulty?: number | null
          id?: number
          ipa?: string | null
          phonemes?: Json | null
          sound_focus?: string | null
          sound_id?: number | null
          word?: string | null
        }
        Update: {
          audio_url?: string | null
          difficulty?: number | null
          id?: number
          ipa?: string | null
          phonemes?: Json | null
          sound_focus?: string | null
          sound_id?: number | null
          word?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "words_sound_fk"
            columns: ["sound_id"]
            isOneToOne: false
            referencedRelation: "sounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "words_sound_id_fkey"
            columns: ["sound_id"]
            isOneToOne: false
            referencedRelation: "sounds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_random_word: {
        Args: { p_sound_id: number }
        Returns: {
          audio_url: string | null
          difficulty: number | null
          id: number
          ipa: string | null
          phonemes: Json | null
          sound_focus: string | null
          sound_id: number | null
          word: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "words"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_skill_profile: { Args: { p_user_id: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      update_progress: {
        Args: { p_is_correct: boolean; p_sound_id: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
