export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_sessions: {
        Row: {
          accuracy_pct: number
          completed_at: string
          created_at: string
          duration_ms: number
          exercises_correct: number
          exercises_total: number
          id: string
          practice_context: string | null
          reconciled_step_ids: string[]
          skill_tags: string[]
          source: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          accuracy_pct?: number
          completed_at?: string
          created_at?: string
          duration_ms?: number
          exercises_correct?: number
          exercises_total?: number
          id?: string
          practice_context?: string | null
          reconciled_step_ids?: string[]
          skill_tags?: string[]
          source: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          accuracy_pct?: number
          completed_at?: string
          created_at?: string
          duration_ms?: number
          exercises_correct?: number
          exercises_total?: number
          id?: string
          practice_context?: string | null
          reconciled_step_ids?: string[]
          skill_tags?: string[]
          source?: string
          user_id?: string
          xp_earned?: number
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
          topic: string | null
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
          topic?: string | null
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
          topic?: string | null
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
          meanings: Json | null
          notes: string | null
          phrases: string[] | null
          sound_id: number | null
          tags: string[] | null
          updated_at: string | null
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
          meanings?: Json | null
          notes?: string | null
          phrases?: string[] | null
          sound_id?: number | null
          tags?: string[] | null
          updated_at?: string | null
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
          meanings?: Json | null
          notes?: string | null
          phrases?: string[] | null
          sound_id?: number | null
          tags?: string[] | null
          updated_at?: string | null
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
      journal_entries: {
        Row: {
          content: string
          corrected_content: string | null
          created_at: string
          entry_date: string
          feedback: Json | null
          id: string
          prompt: string
          prompt_topic: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          corrected_content?: string | null
          created_at?: string
          entry_date: string
          feedback?: Json | null
          id: string
          prompt?: string
          prompt_topic?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          corrected_content?: string | null
          created_at?: string
          entry_date?: string
          feedback?: Json | null
          id?: string
          prompt?: string
          prompt_topic?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          completed_at: string
          course_slug: string
          id: string
          lesson_slug: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_slug: string
          id?: string
          lesson_slug: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_slug?: string
          id?: string
          lesson_slug?: string
          source?: string
          updated_at?: string
          user_id?: string
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
      pronunciation_assessments: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          result: Json
          schema_version: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          result: Json
          schema_version: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          result?: Json
          schema_version?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count: number
          key: string
          updated_at?: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      sentence_transcription_cache: {
        Row: {
          cache_key: string
          created_at: string
          mime_type: string
          payload_size: number
          transcript: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          mime_type: string
          payload_size?: number
          transcript: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          mime_type?: string
          payload_size?: number
          transcript?: string
          updated_at?: string
          user_id?: string
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
      srs_rating_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string
          evaluator_metadata: Json
          grade: number
          id: string
          idempotency_key: string
          occurred_at: string
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type: string
          evaluator_metadata?: Json
          grade: number
          id?: string
          idempotency_key: string
          occurred_at?: string
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          evaluator_metadata?: Json
          grade?: number
          id?: string
          idempotency_key?: string
          occurred_at?: string
          topic?: string | null
          user_id?: string
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
      topic_srs: {
        Row: {
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string | null
          repetitions: number
          review_count: number
          srs_status: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          repetitions?: number
          review_count?: number
          srs_status?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          repetitions?: number
          review_count?: number
          srs_status?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracked_items: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          ref: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          ref: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          ref?: string
          title?: string | null
          updated_at?: string
          user_id?: string
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
          mastery_pct: number
          next_review: string | null
          streak: number
          total_attempts: number
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
          mastery_pct?: number
          next_review?: string | null
          streak?: number
          total_attempts?: number
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
          mastery_pct?: number
          next_review?: string | null
          streak?: number
          total_attempts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_state: {
        Row: {
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          state: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          cefr_level: string
          created_at: string | null
          display_name: string | null
          id: string
          interests: Json
          role: string | null
          storage_used_kb: number | null
        }
        Insert: {
          cefr_level?: string
          created_at?: string | null
          display_name?: string | null
          id: string
          interests?: Json
          role?: string | null
          storage_used_kb?: number | null
        }
        Update: {
          cefr_level?: string
          created_at?: string | null
          display_name?: string | null
          id?: string
          interests?: Json
          role?: string | null
          storage_used_kb?: number | null
        }
        Relationships: []
      }
      word_definitions: {
        Row: {
          created_at: string
          definition_version: number
          example: string
          id: string
          image_prompt: string
          ipa: string
          meaning: string
          normalized_text: string
          source: string
          synonyms: string[]
          text: string
          translation: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition_version?: number
          example?: string
          id?: string
          image_prompt?: string
          ipa?: string
          meaning: string
          normalized_text: string
          source?: string
          synonyms?: string[]
          text: string
          translation: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition_version?: number
          example?: string
          id?: string
          image_prompt?: string
          ipa?: string
          meaning?: string
          normalized_text?: string
          source?: string
          synonyms?: string[]
          text?: string
          translation?: string
          updated_at?: string
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
          familiarity_confidence: number
          familiarity_status: string
          has_audio: boolean | null
          id: string
          image_prompt: string | null
          interval_days: number
          ipa: string | null
          is_favorite: boolean
          last_reviewed_at: string | null
          mastery_provenance: string
          mastery_version: number
          meaning: string | null
          next_review_at: string | null
          objective_evidence_count: number
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
          verification_due_at: string | null
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
          familiarity_confidence?: number
          familiarity_status?: string
          has_audio?: boolean | null
          id?: string
          image_prompt?: string | null
          interval_days?: number
          ipa?: string | null
          is_favorite?: boolean
          last_reviewed_at?: string | null
          mastery_provenance?: string
          mastery_version?: number
          meaning?: string | null
          next_review_at?: string | null
          objective_evidence_count?: number
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
          verification_due_at?: string | null
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
          familiarity_confidence?: number
          familiarity_status?: string
          has_audio?: boolean | null
          id?: string
          image_prompt?: string | null
          interval_days?: number
          ipa?: string | null
          is_favorite?: boolean
          last_reviewed_at?: string | null
          mastery_provenance?: string
          mastery_version?: number
          meaning?: string | null
          next_review_at?: string | null
          objective_evidence_count?: number
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
          verification_due_at?: string | null
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
      word_enrichment_jobs: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          run_after: string
          status: string
          updated_at: string
          user_id: string
          word_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          run_after?: string
          status?: string
          updated_at?: string
          user_id: string
          word_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          run_after?: string
          status?: string
          updated_at?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_enrichment_jobs_word_id_fkey"
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
      _sm2_derive_status: {
        Args: { p_interval: number; p_repetitions: number }
        Returns: string
      }
      _sm2_schedule_next: {
        Args: {
          p_ease: number
          p_grade: number
          p_interval: number
          p_now: string
          p_repetitions: number
        }
        Returns: {
          next_ease: number
          next_interval: number
          next_repetitions: number
          next_review_at: string
        }[]
      }
      apply_topic_srs_rating_event: {
        Args: {
          p_evaluator_metadata?: Json
          p_grade: number
          p_idempotency_key: string
          p_occurred_at?: string
          p_topic: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string | null
          repetitions: number
          review_count: number
          srs_status: string
          topic: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "topic_srs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_word_bank_rating_event: {
        Args: {
          p_evaluator_metadata?: Json
          p_grade: number
          p_idempotency_key: string
          p_occurred_at?: string
          p_user_id: string
          p_word_id: string
        }
        Returns: {
          audio_fetch_attempts: number
          audio_url: string | null
          context: string | null
          created_at: string
          difficulty: number
          ease_factor: number
          error_reason: string | null
          example: string | null
          familiarity_confidence: number
          familiarity_status: string
          has_audio: boolean | null
          id: string
          image_prompt: string | null
          interval_days: number
          ipa: string | null
          is_favorite: boolean
          last_reviewed_at: string | null
          mastery_provenance: string
          mastery_version: number
          meaning: string | null
          next_review_at: string | null
          objective_evidence_count: number
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
          verification_due_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "word_bank"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_enrichment_jobs: {
        Args: { p_batch_size?: number; p_worker_id?: string }
        Returns: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          run_after: string
          status: string
          updated_at: string
          user_id: string
          word_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "word_enrichment_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      consume_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_ms: number }
        Returns: {
          allowed: boolean
          retry_after_seconds: number
        }[]
      }
      get_activity_totals: {
        Args: never
        Returns: {
          active_days: number
          duration_ms: number
          exercises: number
          sessions: number
        }[]
      }
      get_lesson_completion_total: { Args: never; Returns: number }
      is_valid_interest_list: { Args: { value: Json }; Returns: boolean }
      text_fragments_within_limit: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

