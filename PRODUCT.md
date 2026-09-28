# Product

## Register

product

## Users

Anyone who wants to understand and speak useful English from the beginning, from absolute beginners (A1) to advanced learners refining pronunciation, fluency, register, and connected speech. The audience includes:

- Adults who self-study daily at home or during a commute, motivated and self-directed
- Students (secondary school, university) who study English as a subject and want extra oral practice
- Professionals who need clearer spoken English for interviews, presentations, or work calls
- Casual learners who want to practice without needing prior knowledge of phonetics or IPA

What unites them: they open the app with a specific intent (a practice session, a review, a new word) and want to get into it quickly. They care about progress over time and notice when feedback feels meaningful versus generic. They do not need to know what a minimal pair is to benefit from one.

## Product Purpose

A personal speaking and comprehension environment built around useful everyday phrases. The app helps learners understand, retrieve, adapt, and pronounce language they can use now. Words remain essential, but the learner meets and practices them inside communicative chunks whenever the content permits it. Beginners receive enough support to speak from A1; advanced learners gain precision, range, and depth. Success means returning because the app expands what the learner can understand and say, not because a streak demands it.

## Learning System

The product is one connected learning loop, not a collection of independent
features. Routes, decks and mini-lessons introduce theory; Essential Words,
Sound Lab, exercises and oral missions produce practice; saved words and phrases
express personal intent; Daily and Review decide what deserves attention; and
Progress explains the resulting evidence.

Every action contributes only the signal it can honestly support. Reading means
exposure, lesson completion means coverage, saving means intent, and evaluated
practice means evidence. Mastery requires objective evidence over time and must
never be inferred from navigation, bookmarks, streaks or raw activity volume.

The canonical product and architecture contract is
[`docs/architecture/integrated-learning-loop.md`](docs/architecture/integrated-learning-loop.md).
The canonical pedagogical contract for chunk-first learning is
[`docs/architecture/chunk-first-learning.md`](docs/architecture/chunk-first-learning.md).

## Brand Personality

Warm, personal, alive. The app feels like a trusted companion you return to willingly, not a tool you feel obligated to use. It is attentive without being clingy, encouraging without being hollow. It takes pronunciation seriously without making the learner feel tested. Curiosity is rewarded: sound patterns, IPA symbols, and linguistic mechanics are things to notice and enjoy, not facts to memorize. The voice is calm, direct, and a little human.

## Anti-references

- **Duolingo as a visual or motivational model**: cartoonish gamification, mascot energy, and pressure loops. The app may adapt effective learning mechanics from commercial products, but it keeps an adult tone and evidence-based progress.
- **Generic SaaS dashboard**: navy sidebar, white card grids, blue primary buttons, identical spacing everywhere. Design that signals "enterprise software" rather than "personal learning environment".
- **Corporate language apps (Rosetta Stone, Babbel, e-learning platforms)**: stiff, institutional, joyless. Heavy branded shells, generic stock-photo aesthetics, learning that feels like a compliance module.

## Design Principles

1. **The session is sacred.** Once a learner is in a practice session or recording flow, nothing interrupts: no modals, no notifications, no competing CTAs. On **mobile**, the bottom nav hides during active sessions so the exercise owns the viewport; exit stays in the session header (X). On **desktop**, the sidebar stays. The content area may narrow for focus.
2. **Feedback earns its weight.** Every AI insight, every score, every correction should feel considered, not bulk-generated. Copy and visual hierarchy signal that the feedback matters.
3. **Progress is felt, not just counted.** Avoid hero-metric dashboards. Improvement should emerge through texture: words mastered, sounds clicked into place, sessions built over time.
4. **Curious over correct.** The interface invites exploration. IPA symbols, sound patterns, and linguistic categories are interesting things to notice, not intimidating facts to memorize.
5. **Personal before polished.** The app should feel like it belongs to the learner, not like a branded product they happen to use. Warmth and small human touches matter more than surface shine.

## Accessibility & Inclusion

WCAG AA. High contrast for IPA and phonetic annotations (often small, dense text). Keyboard navigability for all practice flows. Respect `prefers-reduced-motion` for animations. Color never the sole signal for correctness feedback (always paired with label or icon). Latin-ext font coverage for IPA characters. Entry points that do not require phonetic knowledge (IPA, minimal pair terminology) to begin practicing.
