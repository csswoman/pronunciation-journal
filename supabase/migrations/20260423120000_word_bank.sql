-- ── Word Bank ─────────────────────────────────────────────────────────────────
-- Quick-capture vocabulary feature.
-- Users save a word in <3s; AI enriches it asynchronously.
-- Distinct from the system "words" table (which holds sounds-practice vocabulary).

CREATE TABLE IF NOT EXISTS "public"."word_bank" (
    "id"            uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "user_id"       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    "text"          text NOT NULL,
    "context"       text,

    "meaning"       text,
    "translation"   text,
    "ipa"           text,
    "example"       text,
    "synonyms"      text[],
    "image_prompt"  text,

    "status"        text NOT NULL DEFAULT 'processing'
                    CHECK (status IN ('processing', 'ready', 'failed')),
    "error_reason"  text,
    "difficulty"    integer NOT NULL DEFAULT 0,

    "created_at"    timestamptz NOT NULL DEFAULT now(),
    "updated_at"    timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT word_bank_pkey PRIMARY KEY (id)
);

ALTER TABLE "public"."word_bank" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS word_bank_user_created_idx
    ON "public"."word_bank" (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS word_bank_status_idx
    ON "public"."word_bank" (status) WHERE status = 'processing';

CREATE TRIGGER "word_bank_updated_at"
    BEFORE UPDATE ON "public"."word_bank"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE "public"."word_bank" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "word_bank_select" ON "public"."word_bank"
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "word_bank_insert" ON "public"."word_bank"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "word_bank_update" ON "public"."word_bank"
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "word_bank_delete" ON "public"."word_bank"
    FOR DELETE USING (user_id = auth.uid());
