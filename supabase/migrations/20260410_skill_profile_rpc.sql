-- Skill Profile RPC - Complete aggregate function for dashboard
-- Returns JSON with all skill scores, trends, and stats

CREATE OR REPLACE FUNCTION get_skill_profile(p_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE
AS $$

WITH user_data AS (
  -- Base user info
  SELECT
    p_user_id as user_id,
    CURRENT_DATE as today
),

-- PRONUNCIATION SKILL
-- Exercise types: pick_word (1) and minimal_pair (3)
pronunciation_data AS (
  SELECT
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN ah.is_correct THEN 1 END) as correct_answers,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(CASE WHEN ah.is_correct THEN 1 END)::NUMERIC / COUNT(*)) * 100, 1)
    END as accuracy,
    COALESCE(
      ROUND(AVG((ah.exercise_payload->>'accuracy')::NUMERIC), 1),
      0
    ) as payload_accuracy
  FROM answer_history ah
  WHERE ah.user_id = p_user_id
    AND ah.exercise_type_id IN (1, 3)  -- pick_word, minimal_pair
    AND ah.answered_at > NOW() - INTERVAL '30 days'
),

-- LISTENING SKILL
-- Exercise types: pick_sound (2), minimal_pair (3), dictation (4)
listening_data AS (
  SELECT
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN ah.is_correct THEN 1 END) as correct_answers,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(CASE WHEN ah.is_correct THEN 1 END)::NUMERIC / COUNT(*)) * 100, 1)
    END as accuracy
  FROM answer_history ah
  WHERE ah.user_id = p_user_id
    AND ah.exercise_type_id IN (2, 3, 4)  -- pick_sound, minimal_pair, dictation
    AND ah.answered_at > NOW() - INTERVAL '30 days'
),

-- VOCABULARY SKILL
-- Count of user entries + mastered sounds
vocabulary_data AS (
  SELECT
    COUNT(DISTINCT e.id) as total_entries,
    COUNT(DISTINCT CASE
      WHEN e.sound_id IS NOT NULL
        AND usp.status = 'mastered'
      THEN e.id
    END) as mastered_entries,
    COUNT(DISTINCT CASE
      WHEN usp.status = 'mastered'
      THEN usp.sound_id
    END) as mastered_sounds
  FROM entries e
  LEFT JOIN user_sound_progress usp
    ON e.sound_id = usp.sound_id
    AND e.user_id = usp.user_id
  WHERE e.user_id = p_user_id
),

-- TODAY STATS
today_stats AS (
  SELECT
    COUNT(*) as today_attempts,
    COUNT(CASE WHEN ah.is_correct THEN 1 END) as today_correct,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(CASE WHEN ah.is_correct THEN 1 END)::NUMERIC / COUNT(*)) * 100, 1)
    END as today_accuracy
  FROM answer_history ah
  CROSS JOIN user_data
  WHERE ah.user_id = p_user_id
    AND DATE(ah.answered_at AT TIME ZONE 'UTC') = (user_data.today AT TIME ZONE 'UTC')
),

-- 7-DAY TREND (daily breakdown) - pre-aggregate first
trend_7d_agg AS (
  SELECT
    DATE(ah.answered_at AT TIME ZONE 'UTC') as trend_date,
    COUNT(*) as attempts,
    COUNT(CASE WHEN ah.is_correct THEN 1 END) as correct_count
  FROM answer_history ah
  WHERE ah.user_id = p_user_id
    AND ah.answered_at > NOW() - INTERVAL '7 days'
  GROUP BY DATE(ah.answered_at AT TIME ZONE 'UTC')
),

trend_7d AS (
  SELECT
    COALESCE(json_agg(
      json_build_object(
        'date', trend_date::text,
        'accuracy', ROUND((correct_count::NUMERIC / NULLIF(attempts, 0)) * 100, 1),
        'attempts', attempts
      ) ORDER BY trend_date
    ), '[]'::json) as data
  FROM trend_7d_agg
),

-- CURRENT STREAK & BEST STREAK (from user_sound_progress)
streak_data AS (
  SELECT
    COALESCE(MAX(streak), 0) as current_streak,
    COALESCE(MAX(best_streak), 0) as best_streak,
    COALESCE(MAX(CASE WHEN last_practiced IS NOT NULL THEN 1 ELSE 0 END), 0) as sounds_practiced,
    COUNT(*) as total_sounds
  FROM user_sound_progress
  WHERE user_id = p_user_id
),

-- SOUNDS DUE TODAY (for next review)
sounds_due_today AS (
  SELECT COUNT(*) as count
  FROM user_sound_progress
  WHERE user_id = p_user_id
    AND next_review IS NOT NULL
    AND next_review <= NOW()
    AND status IN ('available', 'learning', 'review')
),

-- SKILL SCORE CALCULATIONS (0-100)
skill_scores AS (
  SELECT
    -- Pronunciation: accuracy from answer_history + payload accuracy
    CASE
      WHEN pd.total_attempts = 0 THEN 0
      ELSE LEAST(100, GREATEST(0, ROUND(
        (pd.accuracy * 0.6 + COALESCE(pd.payload_accuracy, 0) * 0.4)::NUMERIC, 1
      )))
    END as pronunciation_score,

    -- Listening: accuracy from exercises
    CASE
      WHEN ld.total_attempts = 0 THEN 0
      WHEN ld.total_attempts < 5 THEN LEAST(100, GREATEST(0, ld.accuracy * 0.8))  -- Penalty for low sample
      ELSE LEAST(100, GREATEST(0, ld.accuracy))
    END as listening_score,

    -- Vocabulary: mastered entries ratio + retention indicator
    CASE
      WHEN vd.total_entries = 0 THEN 0
      ELSE LEAST(100, GREATEST(0, ROUND(
        (vd.mastered_entries::NUMERIC / NULLIF(vd.total_entries, 0)) * 100, 1
      )))
    END as vocabulary_score,

    -- Speaking: Proxy from pronunciation (no separate data)
    CASE
      WHEN pd.total_attempts = 0 THEN 0
      ELSE LEAST(100, GREATEST(0, ROUND(
        (pd.accuracy * 0.6 + COALESCE(pd.payload_accuracy, 0) * 0.4)::NUMERIC, 1
      )))
    END as speaking_score,

    -- Reading: 0 (not tracked)
    0 as reading_score,

    -- Writing: 0 (not tracked)
    0 as writing_score,

    pd.total_attempts as pron_attempts,
    pd.accuracy as pron_accuracy,
    ld.total_attempts as list_attempts,
    ld.accuracy as list_accuracy,
    vd.total_entries,
    vd.mastered_entries
  FROM pronunciation_data pd
  CROSS JOIN listening_data ld
  CROSS JOIN vocabulary_data vd
)

-- FINAL JSON OUTPUT
SELECT json_build_object(
  'skills', json_build_object(
    'pronunciation', json_build_object(
      'score', ss.pronunciation_score,
      'attempts', ss.pron_attempts,
      'accuracy', ss.pron_accuracy,
      'confidence', CASE WHEN ss.pron_attempts < 10 THEN 'low' WHEN ss.pron_attempts < 30 THEN 'medium' ELSE 'high' END
    ),
    'listening', json_build_object(
      'score', ss.listening_score,
      'attempts', ss.list_attempts,
      'accuracy', ss.list_accuracy,
      'confidence', CASE WHEN ss.list_attempts < 5 THEN 'low' WHEN ss.list_attempts < 15 THEN 'medium' ELSE 'high' END
    ),
    'vocabulary', json_build_object(
      'score', ss.vocabulary_score,
      'totalEntries', ss.total_entries,
      'masteredEntries', ss.mastered_entries,
      'confidence', CASE WHEN ss.total_entries < 5 THEN 'low' ELSE 'medium' END
    ),
    'speaking', json_build_object(
      'score', ss.speaking_score,
      'note', 'Based on pronunciation accuracy'
    ),
    'reading', json_build_object(
      'score', ss.reading_score,
      'note', 'Start a reading exercise to unlock'
    ),
    'writing', json_build_object(
      'score', ss.writing_score,
      'note', 'Start a writing exercise to unlock'
    )
  ),
  'today', json_build_object(
    'attempts', COALESCE(ts.today_attempts, 0),
    'correct', COALESCE(ts.today_correct, 0),
    'accuracy', COALESCE(ts.today_accuracy, 0),
    'streak', COALESCE(sd.current_streak, 0)
  ),
  'streak', json_build_object(
    'current', COALESCE(sd.current_streak, 0),
    'best', COALESCE(sd.best_streak, 0),
    'soundsPracticed', COALESCE(sd.sounds_practiced, 0),
    'totalSounds', COALESCE(sd.total_sounds, 0)
  ),
  'trend7d', COALESCE(t7d.data, '[]'::json),
  'soundsDueToday', COALESCE(sdt.count, 0),
  'overallScore', LEAST(100, GREATEST(0, ROUND(
    (ss.pronunciation_score + ss.listening_score + ss.vocabulary_score + ss.speaking_score) / 4.0, 1
  )))
)
FROM skill_scores ss
CROSS JOIN (SELECT today_attempts, today_correct, today_accuracy FROM today_stats) ts
CROSS JOIN (SELECT current_streak, best_streak, sounds_practiced, total_sounds FROM streak_data) sd
CROSS JOIN (SELECT data FROM trend_7d) t7d
CROSS JOIN (SELECT count FROM sounds_due_today) sdt;

$$ SECURITY DEFINER;

-- Set up proper permissions
ALTER FUNCTION get_skill_profile(uuid) OWNER TO postgres;

-- Create index for faster answer_history queries
CREATE INDEX IF NOT EXISTS idx_answer_history_user_date
ON answer_history(user_id, answered_at DESC)
WHERE is_correct IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_sound_progress_user_next_review
ON user_sound_progress(user_id, next_review)
WHERE status IS NOT NULL;
