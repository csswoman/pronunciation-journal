# English Journal — Architecture Big Picture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Next.js App │  │  Dexie.js    │  │  Web APIs             │ │
│  │  (App Router)│  │  (IndexedDB) │  │  MediaRecorder        │ │
│  │              │  │              │  │  Web Audio API        │ │
│  │  React 19    │  │  attempts    │  │  Web Speech API       │ │
│  │  Tailwind 4  │  │  srsData     │  │  Whisper WASM Worker  │ │
│  │  Zustand     │  │  dailyProg   │  │  (Xenova/whisper-     │ │
│  │  Context     │  │  userStats   │  │   base.en, q8)        │ │
│  │              │  │  favorites   │  └───────────────────────┘ │
│  │              │  │  aiConvs     │                             │
│  │              │  │  aiWords     │                             │
│  │              │  │  syncOutbox  │  ← offline write queue      │
│  └──────┬───────┘  └──────────────┘                            │
│         │                                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │ HTTP / Streaming
┌─────────▼───────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (API Routes)                   │
│                                                                  │
│   /api/gemini           — chat, streaming, model fallback        │
│   /api/gemini/transcribe — audio → text (cached)                 │
│   /api/gemini/deck-suggest — AI word suggestions                 │
│                                                                  │
│   Model fallback: 2.5-flash-lite → 2.5-flash → flash-latest     │
└──────────┬──────────────────────────────────────────────────────┘
           │
     ┌─────┴──────────────────┐
     │                        │
┌────▼──────────┐    ┌────────▼────────────────────────────────┐
│  Gemini API   │    │              Supabase                    │
│  (Google AI)  │    │                                          │
│               │    │  Auth (email, anonymous)                 │
│  - Chat       │    │                                          │
│  - TTS        │    │  PostgreSQL ─────────────────────────┐   │
│  - Transcribe │    │  ┌─────────────┐  ┌───────────────┐  │   │
│  - Suggest    │    │  │ System tables│  │  User tables  │  │   │
└───────────────┘    │  │             │  │               │  │   │
                     │  │ sounds      │  │ user_profiles │  │   │
                     │  │ words       │  │ entries       │  │   │
                     │  │ minimal_pair│  │ decks         │  │   │
                     │  │ patterns    │  │ deck_entries  │  │   │
                     │  │ exercise_typ│  │ answer_history│  │   │
                     │  └─────────────┘  │ user_sound_pr │  │   │
                     │                   │ theory_lessons│  │   │
                     │                   │ ai_prompts    │  │   │
                     │                   │ text_fragments│  │   │
                     │                   └───────────────┘  │   │
                     │                                       │   │
                     │  Storage Buckets ─────────────────────┘   │
                     │  audio/{user_id}/{uuid}.ogg               │
                     │  lesson-covers/                           │
                     └───────────────────────────────────────────┘
```

---

## Feature Domains

```
english-journal/
│
├── PRONUNCIATION TRAINING          /lesson/[id]
│   Record → Transcribe (Gemini) → Score (phoneme alignment)
│   → Feedback → Save attempt (Dexie via finishAttempt)
│
├── PHONEME SOUND PRACTICE          /practice/[soundId]
│   IPA sound → Stage picker → Exercises
│   (pick_word, pick_sound, minimal_pair, dictation)
│   → SM-2 SRS → user_sound_progress (Supabase via outbox)
│   → Unlock chain: locked → learning → review → mastered
│
├── AI TUTOR                        /ai-practice
│   Templates (practice-questions, sentence-correction,
│   personalized-practice, free-conversation)
│   → Gemini chat → StepRenderer → Save words (Dexie)
│
├── VOCABULARY DECKS                /decks
│   Create deck → Add entries (manual / dictionary API / AI suggest)
│   → entries + deck_entries (Supabase)
│   → StudyModal for review
│
├── THEORY LESSONS                  /lessons
│   Markdown editor → theory_lessons (Supabase)
│   CEFR levels A1–C1, published/draft status
│   Static fallback from content/ JSON files
│
├── SPACED REPETITION REVIEW        /review
│   Due sounds (next_review ≤ now) → exercises
│   → SM-2 recalculate → update Supabase
│
└── PROGRESS & ACHIEVEMENTS         /progress
    Daily stats, streaks, mastered sounds, XP
    Source: Dexie (local) + Supabase (sound progress)
```

---

## Data Flow: Audio Pipeline

```
Microphone
    │
    ▼
MediaRecorder (useRecorder)
    │  MIME: audio/webm → audio/mp4 → audio/wav (browser fallback)
    │  Blob chunks → base64 DataURL (stored in React state)
    ▼
ArrayBuffer (blob.arrayBuffer())
    │
    ▼  postMessage with Transferable
┌───────────────────────────────────────────────────┐
│           whisper.worker.ts (Web Worker)           │
│                                                    │
│  AudioContext.decodeAudioData()                    │
│     → OfflineAudioContext resample to 16kHz mono  │
│     → RMS normalization (target ~0.1 RMS)          │
│     → 0.4s silence padding, min 1.5s length        │
│  pipeline("automatic-speech-recognition",          │
│     "Xenova/whisper-base.en", { dtype: "q8" })     │
│                                                    │
│  Messages: progress | ready | result | error       │
└──────────────────┬────────────────────────────────┘
                   │  { text }  (first result wins)
    ┌──────────────┤
    │  Web Speech  │  (parallel fast path, online)
    └──────────────┘
    │  transcript
    ▼
scorePronunciation()  ←── lib/scoring.ts
    │  phoneme alignment
    ▼
ScoringResult { accuracy, phonemes[], feedback }
    │
    ├── → PronunciationFeedback (UI)
    └── → finishAttempt() → Dexie.attempts (persist)
```

---

## Data Flow: Offline Sync (Outbox Pattern)

```
Local write (Dexie transaction)
    │
    ├── db.someTable.put(localRow)         ← optimistic local state
    └── enqueue(table, operation, payload) ← queued to db.syncOutbox
              │
              │  (atomic: both commit or both roll back)
              ▼
        syncOutbox entry { status: 'pending' }
              │
    ┌─────────┴──────────────────┐
    │  Online event / app start  │
    └─────────┬──────────────────┘
              ▼
         flushOutbox()  ←── lib/sync/sync-manager.ts
              │  batch 30 entries, pending → syncing
              │
              ├── Supabase .insert / .upsert / .update / .delete
              │
              ├── success → delete entry from outbox
              └── failure → retryCount++
                    ├── retryCount < 3 AND not permanent → 'pending' (retry)
                    └── permanent (RLS/FK/duplicate) → 'failed' (manual)

Permanent error codes: 42501 (RLS), 23514 (check), 23503 (FK), 23505 (unique)

useSyncOutbox() hook: exposes { status, flush, hasPending, hasFailed }
  → polls counts every 15s, refreshes on 'online' event
```

---

## Data Flow: AI Practice Session

```
User selects template
    │
    ▼
TemplateInputForm  (topic, difficulty, vars)
    │
    ▼
buildPrompt()  ←── lib/ai-prompts.ts
    │  system prompt + user message
    ▼
POST /api/gemini  (proxied, streamed)
    │
    ▼
Gemini 2.5-flash (with fallback)
    │  structured JSON response
    ▼
parseSession()  ←── lib/parse-session.ts
    │  steps: [explanation, exercise, ...]
    ▼
StepRenderer → WorkspacePanel
    │
    ├── Explanation cards
    ├── Exercise prompts
    └── Chat continues (ChatView / MessageBubble)
              │
              ▼
         SaveWordModal → Dexie.aiWords
```

---

## State Architecture

```
                ┌─────────────────────────┐
                │     React Context       │
                │  AuthContext (Supabase) │
                │  ThemeContext (OKLCH)   │
                └─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│               Zustand — useJournalStore (store/)             │
│                                                              │
│  Volatile UI state only. No persistence.                     │
│                                                              │
│  recordingPhase: "idle"|"recording"|"processing"|"done"      │
│  currentPhoneme: string | null                               │
│  currentLessonId: string | null                              │
│  aiDialog: { open: false } | { open: true, word, context }  │
│  lastAttemptAccuracy: number | null  (optimistic flash)      │
│                                                              │
│  Actions:                                                    │
│    setRecordingPhase / setCurrentPhoneme                     │
│    startLessonSession / endLessonSession                     │
│    openAIDialog / closeAIDialog                              │
│    finishAttempt(word, result, xp, { serverAction? })        │
│      1. Optimistic UI update (instant)                       │
│      2. Dexie writes (attempts + dailyProgress + userStats)  │
│      3. Optional Server Action → Supabase (fire-and-forget)  │
│    reset                                                     │
│                                                              │
│  Selector hooks (avoid unnecessary re-renders):              │
│    useRecordingPhase / useCurrentPhoneme                     │
│    useAIDialog / useLastAttemptAccuracy                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│       Dexie Live Queries — useLiveData (store/)              │
│                                                              │
│  Reactive: auto-update when Zustand writes to Dexie          │
│                                                              │
│  useLiveAttempts(limit)                                      │
│  useLiveAttemptsForWord(word)                                │
│  useLiveAttemptsForLesson(lessonId)                          │
│  useLiveTodayProgress()                                      │
│  useLiveProgressHistory(days)                                │
│  useLiveConversations(limit)                                 │
│  useLiveConversation(id)                                     │
│  useLiveAIWords(limit)                                       │
│  useLiveAIWordsForConversation(conversationId)               │
│  useLiveDueWords()                                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│         Domain Hooks (hooks/) — business logic               │
│                                                              │
│  useAIPractice    useLesson       usePracticeSession         │
│  useRecorder      useScoring      useWebSpeech               │
│  useWhisper       useUserRole     useUserPreferences         │
│  useMasteredSounds                useOKLCHTheme              │
│  useSyncOutbox    ← outbox status + manual flush             │
└──────────────────────────────────────────────────────────────┘

Persistence layers:
  UI state      → Zustand only (ephemeral, no persist middleware)
  Attempts      → Zustand action → Dexie (attempts, dailyProgress, userStats)
  Sound SRS     → Dexie (srsData) + Supabase via syncOutbox (user_sound_progress)
  Sync queue    → Dexie.syncOutbox → Supabase (flushed on online event)
  Conversations → Dexie (aiConversations, aiWords)
  Audio files   → Supabase Storage (OGG/Opus, ~50-80KB)

Import path:
  import { useJournalStore, useLiveAttempts } from "@/store"
```

---

## Routes Map

```
/
├── /                        Home (hero, quick actions)
├── /dashboard               Dashboard overview
│
├── /practice                Practice lessons grid
│   ├── /practice/[soundId]  Sound practice + exercises
│   └── /practice/lesson/[id] Active lesson session
│
├── /lesson/[id]             Lesson detail + recording
│
├── /lessons                 Browse theory lessons
│   ├── /lessons/new         Create lesson (Markdown editor)
│   └── /lessons/[slug]      View lesson
│       └── /edit            Edit lesson
│
├── /ipa                     IPA chart explorer
├── /ai-practice             AI tutor chat
├── /decks                   Vocabulary decks
├── /review                  SRS review session
├── /progress                Progress + achievements
├── /profile                 Settings + theme picker
│
├── /admin
│   ├── /admin/lessons       Manage all lessons
│   └── /admin/seed          Seed DB with sounds/words
│
└── /api
    └── /api/gemini
        ├── /                Chat (streaming)
        ├── /transcribe      Audio → text (cached)
        └── /deck-suggest    AI word suggestions
```

---

## Role & Access Model

```
user_profiles.role = 'free' | 'premium'

Free limits (enforced via RLS):
  decks          → max 5
  entries/deck   → max 30
  ai_prompts     → max 15
  text_fragments → max 10
  saved audios   → max 20

Premium: set via SQL only — never from client
  UPDATE user_profiles SET role = 'premium' WHERE id = '...';

RLS rules:
  System tables  → SELECT only (authenticated)
  User tables    → ALL where user_id = auth.uid()
  theory_lessons → read published + own drafts
  ai_prompts     → read system (is_system=true) + own
```

---

## Key Files Reference

| What | Where |
|------|-------|
| Supabase client | `lib/supabase/client.ts` |
| Auth actions | `lib/supabase/auth-actions.ts` |
| DB types | `lib/supabase/types.ts` |
| Local DB schema | `lib/db.ts`, `lib/ai-db.ts` |
| AI prompt builders | `lib/ai-prompts.ts` |
| Session parser | `lib/parse-session.ts` |
| Pronunciation scoring | `lib/scoring.ts` |
| Audio processing | `lib/audio-utils.ts` |
| SM-2 algorithm | `lib/phoneme-practice/sr.ts`, `lib/srs.ts` |
| Sound queries | `lib/phoneme-practice/queries.ts` |
| Exercise generators | `lib/phoneme-practice/exercises.ts` |
| Theory lesson CRUD | `lib/theory-lessons/queries.ts` |
| Lesson loader (static) | `lib/lesson-generator.ts` |
| Lesson loader (DB) | `lib/lesson-generator-db.ts` |
| Design tokens | `lib/design-tokens.ts` |
| Core types | `lib/types.ts` |
| **Zustand store** | **`store/useJournalStore.ts`** |
| **Dexie live queries** | **`store/useLiveData.ts`** |
| **Store barrel** | **`store/index.ts`** |
| **Sync outbox types** | **`lib/sync/types.ts`** |
| **Sync manager** | **`lib/sync/sync-manager.ts`** |
| **Offline writes** | **`lib/sync/offline-writes.ts`** |
| **Whisper Web Worker** | **`workers/whisper.worker.ts`** |
| **Sync hook** | **`hooks/useSyncOutbox.ts`** |
