# English Journal

An AI-powered language learning platform for mastering English pronunciation, vocabulary, and comprehension through interactive exercises and spaced repetition.

## Features

### 🎯 Phoneme Practice
- Interactive IPA chart with 100+ English phonetic sounds
- Sound-specific exercises: minimal pairs, dictation, word identification, and sound matching
- Spaced repetition scheduling (SM-2 algorithm) to optimize learning intervals
- Progress tracking with ease factors and mastery levels (locked → learning → review → mastered)

### 🤖 AI-Assisted Practice
- Gemini-powered conversational AI tutor with multiple practice templates
- **Free Conversation**: Chat with the AI for unstructured practice
- **Sentence Correction**: Submit sentences and get detailed linguistic feedback
- **Personalized Practice**: AI generates questions tailored to your level
- **Practice Questions**: Structured Q&A sessions with explanations
- Audio transcription with caching for seamless feedback on pronunciation

### 📚 Theory Lessons
- Comprehensive grammar and phonetics lessons at multiple CEFR levels (A1–C1)
- Markdown-based lesson editor with rich formatting
- Save and organize lessons as public or private
- Lesson covers and progressive difficulty

### 📖 Vocabulary Decks
- Create custom vocabulary collections with meanings and phonetic transcriptions
- Link words to specific English sounds for targeted pronunciation practice
- AI-suggested vocabulary for deck building based on user level
- Spaced repetition review mode for deck mastery

### 🗣️ Pronunciation Recording & Feedback
- Record your pronunciation and get AI-powered feedback
- Phoneme-level scoring based on CMU Pronouncing Dictionary
- Audio waveform visualization for recording sessions
- Save pronunciation recordings for progress review

### 📊 Progress & Analytics
- Track pronunciation attempts and accuracy per word
- Daily streak and XP tracking
- Achievements and milestone celebrations
- Sound mastery journey visualization
- Review reminders for words due for spaced repetition

### 🎨 Customizable Learning Environment
- Theme customization with OKLCH color palette
- Dark mode support
- Responsive design for desktop, tablet, and mobile
- Offline-first architecture with IndexedDB (Dexie) for uninterrupted learning

### 🔐 User Accounts & Storage
- Optional authentication with Supabase
- Guest mode for trying without signing up
- Free and premium user tiers with storage limits
- Secure cloud synchronization when connected

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **State**: React Context + Zustand
- **Local Storage**: Dexie.js (IndexedDB)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Google Gemini API (2.5-flash)
- **Audio**: Web Audio API, Whisper WASM (Xenova), TTS
- **Language Data**: CMU Pronouncing Dictionary, FreeDictionary API
- **Icons**: Lucide React
- **Fonts**: DM Serif Display, Sora, DM Sans

## Development

For setup instructions, environment configuration, and Supabase integration guide, see [docs/SUPABASE_DESDE_CERO.md](./docs/SUPABASE_DESDE_CERO.md).

### Project Structure

- `app/` - Next.js app router pages and API routes
- `components/` - Feature-organized React components
- `hooks/` - Custom hooks (audio, AI, SRS, theme, etc.)
- `lib/` - Utilities, database logic, types, and AI prompts
- `content/` - Static lesson JSON data
- `public/` - Static assets and IPA audio files

## License and Attribution

The sounds included under `public/sounds` are licensed under CC BY-SA 3.0 and are the respective works of Peter Isotalo, User:Erutoon, User:TFighterPilot and User:Adamsa123.
