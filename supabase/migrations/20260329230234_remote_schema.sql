


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."words" (
    "id" integer NOT NULL,
    "word" "text",
    "ipa" "text",
    "sound_id" integer,
    "difficulty" integer DEFAULT 1,
    "audio_url" "text",
    "phonemes" "jsonb",
    "sound_focus" "text"
);


ALTER TABLE "public"."words" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_random_word"("p_sound_id" integer) RETURNS SETOF "public"."words"
    LANGUAGE "sql"
    AS $$
  select *
  from public.words
  where sound_id = p_sound_id
  order by random()
  limit 1;
$$;


ALTER FUNCTION "public"."get_random_word"("p_sound_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.user_sound_progress (user_id, sound_id, status)
  select
    new.id,
    s.id,
    case when row_number() over (order by s.id) <= 5
         then 'available'
         else 'locked'
    end
  from public.sounds s
  on conflict (user_id, sound_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_progress"("p_sound_id" integer, "p_is_correct" boolean) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.user_sound_progress
  set
    total_attempts = total_attempts + 1,
    correct_answers = correct_answers + (case when p_is_correct then 1 else 0 end),
    streak = case
      when p_is_correct then streak + 1
      else 0
    end,
    best_streak = greatest(best_streak,
      case when p_is_correct then streak + 1 else 0 end
    ),
    last_practiced = now(),
    next_review = now() + interval '1 day'
  where user_id = auth.uid()
  and sound_id = p_sound_id;
end;
$$;


ALTER FUNCTION "public"."update_progress"("p_sound_id" integer, "p_is_correct" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "label" "text",
    "category" "text",
    "is_system" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."answer_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sound_id" integer,
    "is_correct" boolean NOT NULL,
    "user_answer" "text",
    "target_word" "text",
    "time_ms" integer,
    "exercise_payload" "jsonb" DEFAULT '{}'::"jsonb",
    "answered_at" timestamp with time zone DEFAULT "now"(),
    "exercise_type_id" integer NOT NULL
);


ALTER TABLE "public"."answer_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deck_entries" (
    "deck_id" "uuid" NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deck_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text",
    "is_system" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."decks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entries" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "word" "text" NOT NULL,
    "ipa" "text",
    "audio_url" "text",
    "user_audio_url" "text",
    "notes" "text",
    "difficulty" integer NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "meanings" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "sound_id" integer,
    CONSTRAINT "entries_difficulty_check" CHECK (("difficulty" = ANY (ARRAY[1, 2, 3])))
);


ALTER TABLE "public"."entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_types" (
    "id" integer NOT NULL,
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL
);


ALTER TABLE "public"."exercise_types" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."exercise_types_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."exercise_types_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."exercise_types_id_seq" OWNED BY "public"."exercise_types"."id";



CREATE TABLE IF NOT EXISTS "public"."minimal_pairs" (
    "id" integer NOT NULL,
    "word_a" "text",
    "word_b" "text",
    "ipa_a" "text",
    "ipa_b" "text",
    "sound_group" "text",
    "sound_a_id" integer,
    "sound_b_id" integer,
    "contrast_sound_a_id" integer,
    "contrast_sound_b_id" integer,
    "contrast_ipa_a" "text",
    "contrast_ipa_b" "text"
);


ALTER TABLE "public"."minimal_pairs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."minimal_pairs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."minimal_pairs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."minimal_pairs_id_seq" OWNED BY "public"."minimal_pairs"."id";



CREATE TABLE IF NOT EXISTS "public"."pattern_words" (
    "id" integer NOT NULL,
    "pattern_id" integer,
    "word" "text",
    "ipa" "text"
);


ALTER TABLE "public"."pattern_words" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pattern_words_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pattern_words_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pattern_words_id_seq" OWNED BY "public"."pattern_words"."id";



CREATE TABLE IF NOT EXISTS "public"."patterns" (
    "id" integer NOT NULL,
    "pattern" "text",
    "type" "text",
    "sound_focus" "text"
);


ALTER TABLE "public"."patterns" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."patterns_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."patterns_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."patterns_id_seq" OWNED BY "public"."patterns"."id";



CREATE TABLE IF NOT EXISTS "public"."sounds" (
    "id" integer NOT NULL,
    "ipa" "text",
    "type" "text",
    "category" "text",
    "example" "text",
    "difficulty" integer,
    CONSTRAINT "valid_type" CHECK (("type" = ANY (ARRAY['vowel'::"text", 'consonant'::"text", 'diphthong'::"text"])))
);


ALTER TABLE "public"."sounds" OWNER TO "postgres";


ALTER TABLE "public"."sounds" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sounds_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."text_fragments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text",
    "content" "text" NOT NULL,
    "source" "text",
    "fragment_type" "text" DEFAULT 'custom'::"text",
    "audio_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."text_fragments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_favorite_prompts" (
    "user_id" "uuid" NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "saved_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_favorite_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'free'::"text",
    "storage_used_kb" integer DEFAULT 0
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sound_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sound_id" integer NOT NULL,
    "total_attempts" integer DEFAULT 0,
    "correct_answers" integer DEFAULT 0,
    "streak" integer DEFAULT 0,
    "best_streak" integer DEFAULT 0,
    "ease_factor" double precision DEFAULT 2.5,
    "interval_days" integer DEFAULT 1,
    "last_practiced" timestamp with time zone,
    "next_review" timestamp with time zone,
    "status" "text" DEFAULT 'available'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "usp_status_check" CHECK (("status" = ANY (ARRAY['locked'::"text", 'available'::"text", 'practicing'::"text", 'mastered'::"text"])))
);


ALTER TABLE "public"."user_sound_progress" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."words_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."words_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."words_id_seq" OWNED BY "public"."words"."id";



ALTER TABLE ONLY "public"."exercise_types" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."exercise_types_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."minimal_pairs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."minimal_pairs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pattern_words" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pattern_words_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."patterns" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."patterns_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."words" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."words_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_prompts"
    ADD CONSTRAINT "ai_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."answer_history"
    ADD CONSTRAINT "answer_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deck_entries"
    ADD CONSTRAINT "deck_entries_pkey" PRIMARY KEY ("deck_id", "entry_id");



ALTER TABLE ONLY "public"."decks"
    ADD CONSTRAINT "decks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entries"
    ADD CONSTRAINT "entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_types"
    ADD CONSTRAINT "exercise_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_types"
    ADD CONSTRAINT "exercise_types_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."minimal_pairs"
    ADD CONSTRAINT "minimal_pairs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pattern_words"
    ADD CONSTRAINT "pattern_words_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patterns"
    ADD CONSTRAINT "patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sounds"
    ADD CONSTRAINT "sounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."text_fragments"
    ADD CONSTRAINT "text_fragments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sounds"
    ADD CONSTRAINT "unique_ipa" UNIQUE ("ipa");



ALTER TABLE ONLY "public"."user_favorite_prompts"
    ADD CONSTRAINT "user_favorite_prompts_pkey" PRIMARY KEY ("user_id", "prompt_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sound_progress"
    ADD CONSTRAINT "user_sound_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sound_progress"
    ADD CONSTRAINT "user_sound_progress_user_id_sound_id_key" UNIQUE ("user_id", "sound_id");



ALTER TABLE ONLY "public"."words"
    ADD CONSTRAINT "words_pkey" PRIMARY KEY ("id");



CREATE INDEX "ah_sound_idx" ON "public"."answer_history" USING "btree" ("sound_id");



CREATE INDEX "ah_user_exercise_idx" ON "public"."answer_history" USING "btree" ("user_id", "exercise_type_id");



CREATE INDEX "ah_user_recent_idx" ON "public"."answer_history" USING "btree" ("user_id", "answered_at" DESC);



CREATE INDEX "ah_user_sound_idx" ON "public"."answer_history" USING "btree" ("user_id", "sound_id");



CREATE INDEX "ah_user_time_idx" ON "public"."answer_history" USING "btree" ("user_id", "answered_at" DESC);



CREATE INDEX "entries_user_id_created_at_idx" ON "public"."entries" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_ai_prompts_is_system" ON "public"."ai_prompts" USING "btree" ("is_system");



CREATE INDEX "idx_ai_prompts_user_id" ON "public"."ai_prompts" USING "btree" ("user_id");



CREATE INDEX "idx_answer_history_user" ON "public"."answer_history" USING "btree" ("user_id");



CREATE INDEX "idx_answer_history_user_id" ON "public"."answer_history" USING "btree" ("user_id");



CREATE INDEX "idx_answer_payload" ON "public"."answer_history" USING "gin" ("exercise_payload");



CREATE INDEX "idx_deck_entries_deck_id" ON "public"."deck_entries" USING "btree" ("deck_id");



CREATE INDEX "idx_deck_entries_entry_id" ON "public"."deck_entries" USING "btree" ("entry_id");



CREATE INDEX "idx_decks_user_id" ON "public"."decks" USING "btree" ("user_id");



CREATE INDEX "idx_entries_user_id" ON "public"."entries" USING "btree" ("user_id");



CREATE INDEX "idx_minimal_pairs_sound_a" ON "public"."minimal_pairs" USING "btree" ("contrast_sound_a_id");



CREATE INDEX "idx_minimal_pairs_sound_b" ON "public"."minimal_pairs" USING "btree" ("contrast_sound_b_id");



CREATE INDEX "idx_progress_user_sound" ON "public"."user_sound_progress" USING "btree" ("user_id", "sound_id");



CREATE INDEX "idx_text_fragments_user_id" ON "public"."text_fragments" USING "btree" ("user_id");



CREATE INDEX "idx_user_sound_progress_user_id" ON "public"."user_sound_progress" USING "btree" ("user_id");



CREATE INDEX "minimal_pairs_contrast_a_idx" ON "public"."minimal_pairs" USING "btree" ("contrast_sound_a_id");



CREATE INDEX "minimal_pairs_contrast_b_idx" ON "public"."minimal_pairs" USING "btree" ("contrast_sound_b_id");



CREATE INDEX "usp_review_idx" ON "public"."user_sound_progress" USING "btree" ("user_id", "next_review");



CREATE INDEX "usp_user_review_idx" ON "public"."user_sound_progress" USING "btree" ("user_id", "next_review");



CREATE INDEX "usp_user_status_idx" ON "public"."user_sound_progress" USING "btree" ("user_id", "status");



CREATE OR REPLACE TRIGGER "decks_updated_at" BEFORE UPDATE ON "public"."decks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."answer_history"
    ADD CONSTRAINT "ah_sound_fk" FOREIGN KEY ("sound_id") REFERENCES "public"."sounds"("id");



ALTER TABLE ONLY "public"."ai_prompts"
    ADD CONSTRAINT "ai_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."answer_history"
    ADD CONSTRAINT "answer_history_exercise_type_fk" FOREIGN KEY ("exercise_type_id") REFERENCES "public"."exercise_types"("id");



ALTER TABLE ONLY "public"."deck_entries"
    ADD CONSTRAINT "deck_entries_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deck_entries"
    ADD CONSTRAINT "deck_entries_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decks"
    ADD CONSTRAINT "decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entries"
    ADD CONSTRAINT "entries_sound_fk" FOREIGN KEY ("sound_id") REFERENCES "public"."sounds"("id");



ALTER TABLE ONLY "public"."entries"
    ADD CONSTRAINT "entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pattern_words"
    ADD CONSTRAINT "pattern_words_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "public"."patterns"("id");



ALTER TABLE ONLY "public"."text_fragments"
    ADD CONSTRAINT "text_fragments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_favorite_prompts"
    ADD CONSTRAINT "user_favorite_prompts_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."ai_prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_favorite_prompts"
    ADD CONSTRAINT "user_favorite_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sound_progress"
    ADD CONSTRAINT "usp_sound_fk" FOREIGN KEY ("sound_id") REFERENCES "public"."sounds"("id");



ALTER TABLE ONLY "public"."words"
    ADD CONSTRAINT "words_sound_fk" FOREIGN KEY ("sound_id") REFERENCES "public"."sounds"("id");



ALTER TABLE ONLY "public"."words"
    ADD CONSTRAINT "words_sound_id_fkey" FOREIGN KEY ("sound_id") REFERENCES "public"."sounds"("id");



CREATE POLICY "Delete own deck entries" ON "public"."deck_entries" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."decks"
  WHERE (("decks"."id" = "deck_entries"."deck_id") AND ("decks"."user_id" = "auth"."uid"())))));



CREATE POLICY "Delete own decks" ON "public"."decks" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Delete own prompts" ON "public"."ai_prompts" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



-- Simplified insert policy for deck_entries: only allow inserting into a deck
-- if the deck belongs to the authenticated user. The previous policy used a
-- subquery referencing the same relation which caused "infinite recursion"
-- errors under RLS. Enforce per-deck limits at the API layer or via a
-- security-definer function if needed.
CREATE POLICY "Insert deck entry owner only" ON public.deck_entries
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.decks
            WHERE decks.id = deck_entries.deck_id
                AND decks.user_id = auth.uid()
        )
    );



CREATE POLICY "Insert deck with limit" ON "public"."decks" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "user_profiles"."role"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())) = 'premium'::"text") OR (( SELECT "count"(*) AS "count"
   FROM "public"."decks" "decks_1"
  WHERE (("decks_1"."user_id" = "auth"."uid"()) AND ("decks_1"."is_system" = false))) < 5)));



CREATE POLICY "Insert prompt with limit" ON "public"."ai_prompts" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND ((( SELECT "user_profiles"."role"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())) = 'premium'::"text") OR (( SELECT "count"(*) AS "count"
   FROM "public"."ai_prompts" "ai_prompts_1"
  WHERE ("ai_prompts_1"."user_id" = "auth"."uid"())) < 15))));



CREATE POLICY "Manage own answer_history" ON "public"."answer_history" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Manage own entries" ON "public"."entries" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Manage own favorite prompts" ON "public"."user_favorite_prompts" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Manage own fragments" ON "public"."text_fragments" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND ((( SELECT "user_profiles"."role"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())) = 'premium'::"text") OR (( SELECT "count"(*) AS "count"
   FROM "public"."text_fragments" "text_fragments_1"
  WHERE ("text_fragments_1"."user_id" = "auth"."uid"())) < 10))));



CREATE POLICY "Manage own progress" ON "public"."user_sound_progress" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Public read" ON "public"."exercise_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public read" ON "public"."minimal_pairs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public read" ON "public"."pattern_words" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public read" ON "public"."patterns" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public read" ON "public"."sounds" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public read" ON "public"."words" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read own and system decks" ON "public"."decks" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("is_system" = true)));



CREATE POLICY "Read own and system prompts" ON "public"."ai_prompts" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("is_system" = true)));



CREATE POLICY "Read own deck entries" ON "public"."deck_entries" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."decks"
  WHERE (("decks"."id" = "deck_entries"."deck_id") AND (("decks"."user_id" = "auth"."uid"()) OR ("decks"."is_system" = true))))));



CREATE POLICY "Read own profile" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Update own decks" ON "public"."decks" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Update own profile" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Update own prompts" ON "public"."ai_prompts" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own history" ON "public"."answer_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own progress" ON "public"."user_sound_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own progress" ON "public"."user_sound_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own history" ON "public"."answer_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own progress" ON "public"."user_sound_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ai_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."answer_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deck_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."decks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "entries_delete_own" ON "public"."entries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "entries_insert_own" ON "public"."entries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "entries_select_own" ON "public"."entries" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "entries_update_own" ON "public"."entries" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."exercise_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."minimal_pairs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pattern_words" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patterns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sounds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."text_fragments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_favorite_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sound_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."words" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON TABLE "public"."words" TO "anon";
GRANT ALL ON TABLE "public"."words" TO "authenticated";
GRANT ALL ON TABLE "public"."words" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_random_word"("p_sound_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_random_word"("p_sound_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_random_word"("p_sound_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_progress"("p_sound_id" integer, "p_is_correct" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_progress"("p_sound_id" integer, "p_is_correct" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_progress"("p_sound_id" integer, "p_is_correct" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."ai_prompts" TO "anon";
GRANT ALL ON TABLE "public"."ai_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."answer_history" TO "anon";
GRANT ALL ON TABLE "public"."answer_history" TO "authenticated";
GRANT ALL ON TABLE "public"."answer_history" TO "service_role";



GRANT ALL ON TABLE "public"."deck_entries" TO "anon";
GRANT ALL ON TABLE "public"."deck_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."deck_entries" TO "service_role";



GRANT ALL ON TABLE "public"."decks" TO "anon";
GRANT ALL ON TABLE "public"."decks" TO "authenticated";
GRANT ALL ON TABLE "public"."decks" TO "service_role";



GRANT ALL ON TABLE "public"."entries" TO "anon";
GRANT ALL ON TABLE "public"."entries" TO "authenticated";
GRANT ALL ON TABLE "public"."entries" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_types" TO "anon";
GRANT ALL ON TABLE "public"."exercise_types" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."exercise_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."exercise_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."exercise_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."minimal_pairs" TO "anon";
GRANT ALL ON TABLE "public"."minimal_pairs" TO "authenticated";
GRANT ALL ON TABLE "public"."minimal_pairs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."minimal_pairs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."minimal_pairs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."minimal_pairs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pattern_words" TO "anon";
GRANT ALL ON TABLE "public"."pattern_words" TO "authenticated";
GRANT ALL ON TABLE "public"."pattern_words" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pattern_words_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pattern_words_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pattern_words_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."patterns" TO "anon";
GRANT ALL ON TABLE "public"."patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."patterns" TO "service_role";



GRANT ALL ON SEQUENCE "public"."patterns_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."patterns_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."patterns_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sounds" TO "anon";
GRANT ALL ON TABLE "public"."sounds" TO "authenticated";
GRANT ALL ON TABLE "public"."sounds" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sounds_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sounds_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sounds_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."text_fragments" TO "anon";
GRANT ALL ON TABLE "public"."text_fragments" TO "authenticated";
GRANT ALL ON TABLE "public"."text_fragments" TO "service_role";



GRANT ALL ON TABLE "public"."user_favorite_prompts" TO "anon";
GRANT ALL ON TABLE "public"."user_favorite_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_favorite_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_sound_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_sound_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sound_progress" TO "service_role";



GRANT ALL ON SEQUENCE "public"."words_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."words_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."words_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "user_audio_delete_own"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'user-audio'::text) AND (auth.uid() IS NOT NULL) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "user_audio_insert_own"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'user-audio'::text) AND (auth.uid() IS NOT NULL) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "user_audio_select_own"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'user-audio'::text) AND (auth.uid() IS NOT NULL) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "user_audio_update_own"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'user-audio'::text) AND (auth.uid() IS NOT NULL) AND ((auth.uid())::text = (storage.foldername(name))[1])))
with check (((bucket_id = 'user-audio'::text) AND (auth.uid() IS NOT NULL) AND ((auth.uid())::text = (storage.foldername(name))[1])));



