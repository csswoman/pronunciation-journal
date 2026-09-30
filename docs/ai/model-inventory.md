# Gemini model inventory

Quota snapshot supplied from the project's Google AI Studio dashboard on
2026-09-24. Usage columns show the dashboard's peak over the last seven days;
limits are project-wide and can change with the project's tier or account state.
The model pricing page lists a Free Tier for each enabled text/TTS model below.

| API model ID | Free tier | RPM peak / limit | TPM peak / limit | RPD peak / limit | App daily budget (80% RPD) | Application use |
|---|---:|---:|---:|---:|---:|---|
| `gemini-3.1-flash-lite` | Yes | 6 / 15 | 5.53K / 250K | 43 / 500 | 400 | `BASE_MODELS`, `QUALITY_FALLBACK_MODELS`; common JSON routes, AI Coach, transcription, word bank |
| `gemini-3.5-flash-lite` | Yes | 0 / 15 | 0 / 250K | 0 / 500 | 400 | `BASE_MODELS`, `QUALITY_FALLBACK_MODELS`, `PREMIUM_MODELS`; common JSON routes and quality routes |
| `gemini-3.8-flash` | Yes | 2 / 5 | 4.25K / 250K | 4 / 20 | 16 | `QUALITY_FALLBACK_MODELS`, `PREMIUM_MODELS`; Reader, production grading, Journal correction, mission chat |
| `gemini-2.5-flash-lite` | Yes; existing users | 1 / 10 | 2 / 250K | 1 / 20 | 16 | `BASE_MODELS` legacy fallback |
| `gemini-3.8-flash-lite-tts` | Yes | 0 / 3 | 0 / 10K | 0 / 10 | 8 | `AUDIO_MODELS`; Reader and mission audio generation |
| `gemini-3.8-flash-tts` | Yes | 0 / 3 | 0 / 10K | 0 / 10 | 8 | `AUDIO_MODELS`; last TTS fallback for Reader and mission audio |

The code previously included `gemini-3.6-flash`, `gemini-3.5-flash`, and
`gemini-3.7-flash` in fallback chains. Their dashboard peaks were respectively
2 / 5 RPM, 536 / 250K TPM, 2 / 20 RPD; 2 / 5 RPM, 536 / 250K TPM, 2 / 20 RPD;
and 1 / 5 RPM, 268 / 250K TPM, 1 / 20 RPD. Plan 035 removes these low-quota
models from the runtime fallback chains.

The maintenance script `scripts/enrich-mini-lessons.ts` previously called
`gemini-2.5-flash` directly. The dashboard showed 3 / 5 RPM, 959 / 250K TPM,
and 23 / 20 RPD for that model. Dashboard totals are not attributable to this
script because it had no feature-level telemetry; Plan 035 moves it onto the
first model in `BASE_MODELS` and caps manual runs.

The dashboard also showed 5 / 3 RPM and 19 / 10 RPD for Gemini 2.5 Flash TTS,
and 3 / 3 RPM and 14 / 10 RPD for Gemini 3.1 Flash TTS. Neither model is in the
current `AUDIO_MODELS` chain; current audio generation uses the two Gemini 3.8
TTS IDs above.

The per-model app budgets in the table are enforced by `reserveModel` after the
`ai_usage_daily` migration is applied. Daily requests are counted across all
features for that model; the report preserves model + feature attribution.

## Sources

- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- Project-specific usage limits and seven-day peaks: Google AI Studio, supplied by the project owner on 2026-09-24.
