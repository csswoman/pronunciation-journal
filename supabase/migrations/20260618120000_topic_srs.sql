CREATE TABLE IF NOT EXISTS "public"."topic_srs" (
    "id"               uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "user_id"          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "topic"            text NOT NULL,

    "ease_factor"      float       NOT NULL DEFAULT 2.5,
    "interval_days"    int         NOT NULL DEFAULT 1,
    "repetitions"      int         NOT NULL DEFAULT 0,
    "next_review_at"   timestamptz,
    "srs_status"       text        NOT NULL DEFAULT 'new'
                       CHECK (srs_status IN ('new','learning','review','mastered')),
    "review_count"     int         NOT NULL DEFAULT 0,
    "last_reviewed_at" timestamptz,

    "created_at"       timestamptz NOT NULL DEFAULT now(),
    "updated_at"       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT topic_srs_pkey PRIMARY KEY (id),
    CONSTRAINT topic_srs_user_topic_unique UNIQUE (user_id, topic)
);

ALTER TABLE "public"."topic_srs" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS topic_srs_next_review_idx
    ON "public"."topic_srs" (user_id, next_review_at)
    WHERE srs_status <> 'mastered';

CREATE TRIGGER "topic_srs_updated_at"
    BEFORE UPDATE ON "public"."topic_srs"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE "public"."topic_srs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topic_srs_select" ON "public"."topic_srs"
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "topic_srs_insert" ON "public"."topic_srs"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "topic_srs_update" ON "public"."topic_srs"
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "topic_srs_delete" ON "public"."topic_srs"
    FOR DELETE USING (user_id = auth.uid());
