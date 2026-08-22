-- Performance migration: optimize RLS policies and high-volume table indexes.
-- 1. Wrapping auth.uid() in (select auth.uid()) allows the PostgreSQL query planner
--    to treat the auth expression as a one-time initplan instead of evaluating per-row.
-- 2. Add composite indexes for common dashboard and progress query patterns.

-- -----------------------------------------------------------------------------
-- 1. Performance Indexes for High-Volume Practice and Progress Tables
-- -----------------------------------------------------------------------------

-- Index answer_history for essential words and correctness filtering
CREATE INDEX IF NOT EXISTS idx_answer_history_user_context_correct
  ON public.answer_history (user_id, context, is_correct);

-- Index word_bank by user + lifecycle status (Progress filters user_id + status='ready';
-- srs_status is grouped client-side after fetch — do not put it before status).
CREATE INDEX IF NOT EXISTS idx_word_bank_user_status
  ON public.word_bank (user_id, status);

-- Index user_contrast_progress by user and total_attempts (used by sound lab and phoneme profile)
CREATE INDEX IF NOT EXISTS idx_user_contrast_progress_user_attempts
  ON public.user_contrast_progress (user_id, total_attempts DESC);

-- -----------------------------------------------------------------------------
-- 2. RLS InitPlan Optimizations with (select auth.uid())
-- -----------------------------------------------------------------------------

-- answer_history: drop existing legacy and consolidated policies before creating optimized ones
DROP POLICY IF EXISTS "Manage own answer_history" ON public.answer_history;
DROP POLICY IF EXISTS "Users can insert own history" ON public.answer_history;
DROP POLICY IF EXISTS "Users can view own history" ON public.answer_history;
DROP POLICY IF EXISTS "Users can read own answer history" ON public.answer_history;
DROP POLICY IF EXISTS "Users can insert own answer history" ON public.answer_history;
DROP POLICY IF EXISTS "Users can update own answer history" ON public.answer_history;

-- Client uses SELECT + upsert (INSERT/UPDATE). No DELETE from the app.
CREATE POLICY "Users can read own answer history"
  ON public.answer_history
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own answer history"
  ON public.answer_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own answer history"
  ON public.answer_history
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- activity_sessions: drop existing policy from 20260616130000_activity_sessions.sql
DROP POLICY IF EXISTS "users manage own activity sessions" ON public.activity_sessions;
DROP POLICY IF EXISTS "Users can read own activity sessions" ON public.activity_sessions;
DROP POLICY IF EXISTS "Users can insert own activity sessions" ON public.activity_sessions;
DROP POLICY IF EXISTS "Users can update own activity sessions" ON public.activity_sessions;

-- Client uses SELECT + upsert (INSERT/UPDATE). No DELETE from the app.
CREATE POLICY "Users can read own activity sessions"
  ON public.activity_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own activity sessions"
  ON public.activity_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own activity sessions"
  ON public.activity_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- word_bank: drop existing policies from 20260423120000_word_bank.sql
DROP POLICY IF EXISTS "word_bank_select" ON public.word_bank;
DROP POLICY IF EXISTS "word_bank_insert" ON public.word_bank;
DROP POLICY IF EXISTS "word_bank_update" ON public.word_bank;
DROP POLICY IF EXISTS "word_bank_delete" ON public.word_bank;
DROP POLICY IF EXISTS "Users can read own word bank" ON public.word_bank;
DROP POLICY IF EXISTS "Users can insert own word bank" ON public.word_bank;
DROP POLICY IF EXISTS "Users can update own word bank" ON public.word_bank;
DROP POLICY IF EXISTS "Users can delete own word bank" ON public.word_bank;

CREATE POLICY "word_bank_select"
  ON public.word_bank
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "word_bank_insert"
  ON public.word_bank
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "word_bank_update"
  ON public.word_bank
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "word_bank_delete"
  ON public.word_bank
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- user_contrast_progress: drop existing policies from 20260602100000_contrast_progress.sql
DROP POLICY IF EXISTS "users can read own contrast progress" ON public.user_contrast_progress;
DROP POLICY IF EXISTS "users can insert own contrast progress" ON public.user_contrast_progress;
DROP POLICY IF EXISTS "users can update own contrast progress" ON public.user_contrast_progress;
DROP POLICY IF EXISTS "Users can read own contrast progress" ON public.user_contrast_progress;
DROP POLICY IF EXISTS "Users can upsert own contrast progress" ON public.user_contrast_progress;

CREATE POLICY "users can read own contrast progress"
  ON public.user_contrast_progress
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "users can insert own contrast progress"
  ON public.user_contrast_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "users can update own contrast progress"
  ON public.user_contrast_progress
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- user_learning_state: drop existing policies from 20260610150000_user_learning_state.sql
DROP POLICY IF EXISTS "user_learning_state_select" ON public.user_learning_state;
DROP POLICY IF EXISTS "user_learning_state_insert" ON public.user_learning_state;
DROP POLICY IF EXISTS "user_learning_state_update" ON public.user_learning_state;
DROP POLICY IF EXISTS "Users can read own learning state" ON public.user_learning_state;
DROP POLICY IF EXISTS "Users can upsert own learning state" ON public.user_learning_state;

CREATE POLICY "user_learning_state_select"
  ON public.user_learning_state
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "user_learning_state_insert"
  ON public.user_learning_state
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_learning_state_update"
  ON public.user_learning_state
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
