# Reproducir las respuestas del AI Coach — Design

**Date:** 2026-09-07
**Status:** Approved
**Branch:** dev

## Goal

Permitir que el estudiante escuche en voz alta las respuestas del AI Coach en el
chat: un botón de escuchar/detener por burbuja, autoplay para la respuesta más
reciente, y un toggle de silencio de sesión en la cabecera del chat.

## Non-goals (YAGNI)

- Resaltado palabra por palabra (se eligió audio simple).
- TTS por Gemini o cualquier servicio en la nube — solo Web Speech API del navegador.
- Preferencias persistentes de voz, velocidad o selección de voz.
- Hablar mensajes del usuario u otras superficies del coach (las misiones ya tienen
  su propio TTS vía `CoachLine`).

## Playback scope

Solo se habla `effectiveProse`: el texto conversacional en inglés de la respuesta,
después de `stripSuggestions`. **No** se habla:

- La tarjeta de corrección (`CorrectionCard`).
- La traducción.
- Los widgets de ejercicio.
- Los chips de sugerencias.

## Architecture

### Nuevo hook: `hooks/useCoachSpeech.ts`

Envuelve `speakText` / `cancelSpeech` de `lib/speech/synthesis.ts` en estado React.

- **Input:** `{ text: string }`
- **Returns:** `{ isSpeaking: boolean, isAvailable: boolean, toggle: () => void, stop: () => void }`
- `toggle()`: si está hablando → `cancelSpeech()`; si no → `speakText(text, { lang: "en-US", onStart, onEnd, onError })`.
- `isAvailable`: `typeof window !== "undefined" && "speechSynthesis" in window`.
- En unmount → `stop()`, para que navegar fuera o un re-render que quite la burbuja
  corte el audio.
- Una sola locución a la vez: `speakText` ya llama a `window.speechSynthesis.cancel()`
  al inicio, así que arrancar una burbuja detiene otra. El hook solo rastrea *su
  propio* estado `isSpeaking`; un `onEnd` provocado por un cancel es inofensivo
  (solo pone `isSpeaking` en `false`).

### Estado de silencio: extender `lib/stores/aiCoachStore.ts`

- Añadir `autoSpeak: boolean` (default `true`) + `toggleAutoSpeak: () => void`.
- Zustand efímero — se reinicia cada sesión, acorde a CLAUDE.md ("Zustand = ephemeral
  UI state only"). Sin Dexie.

### `components/ai-coach/chat/AIBubble.tsx`

- Llamar `useCoachSpeech({ text: effectiveProse })`.
- Añadir un botón de altavoz a la fila de pie existente (líneas ~207-222), junto al
  botón "Traducir": icono `Volume2` en reposo; icono `Square` + "Detener" mientras
  habla. Mismo tratamiento visual que el botón de traducir
  (`text-tiny font-medium text-fg-subtle hover:text-primary transition-colors`).
  Oculto por completo cuando `!isAvailable` o `!effectiveProse.trim()`.
- **Autoplay:** nueva prop `autoSpeak?: boolean` (ya viene condicionada aguas arriba
  por el valor del store y por ser la burbuja más reciente). Un `useRef` guard atado
  a la identidad del `message` (patrón de `autoplayedRef` en `CoachLine`) dispara la
  locución exactamente una vez cuando `autoSpeak` es `true`. Los re-render no la
  repiten; una burbuja genuinamente nueva obtiene su propia celda de ref porque es
  una nueva instancia de componente / nueva key.

### `components/ai-coach/ChatView.tsx`

- Calcular `isNewest` solo para el último mensaje `model` visible
  (`i === visibleMessages.length - 1 && msg.role === "model"`).
- Leer `autoSpeak` de `useAICoachStore`.
- Pasar `autoSpeak={autoSpeak && isNewest}` hacia abajo por `MessageBubble` → `AIBubble`.
  Todas las demás burbujas reciben `false`.

### `components/ai-coach/MessageBubble.tsx`

- Propagar la prop `autoSpeak` hacia `AIBubble` (las ramas de usuario / tool la ignoran).

### Cabecera del chat — toggle de silencio

- La cabecera vive en el padre de `ChatView` (`AICoachPanelViews` / `AICoachPanelParts`).
- Añadir un botón toggle icon-only: `Volume2` cuando `autoSpeak` está activo,
  `VolumeX` cuando está silenciado; llama a `toggleAutoSpeak()`.
- `aria-pressed={!autoSpeak}`, `aria-label="Silenciar voz del coach"`.
- La ubicación exacta del elemento de cabecera se determina al implementar
  (probablemente `AICoachPanelParts.tsx`).

## Error handling

- Sin `speechSynthesis` → el botón no se renderiza; el autoplay es no-op
  (`speakText` ya llama a `onEnd` y retorna).
- `onerror` → `isSpeaking` vuelve a `false`; sin UI de error (consistente con cómo
  `CoachLine` trata el fallo de síntesis como no fatal).
- Offline: la Web Speech API es local del navegador, funciona sin conexión. No hay
  llamadas de red nuevas, así que el modo offline no se ve afectado.

## Testing (Vitest)

- `hooks/__tests__/useCoachSpeech.test.ts` — stub de `window.speechSynthesis` +
  `SpeechSynthesisUtterance` (patrón ya presente en `vitest.setup.ts`); afirmar que
  toggle arranca/detiene, la rama `isAvailable === false`, y que unmount llama a cancel.
- `components/ai-coach/chat/__tests__/AIBubble.test.tsx` (existe) — añadir: el botón
  de altavoz se renderiza cuando hay prosa y TTS disponible; oculto cuando no
  disponible; `autoSpeak` dispara una locución al montar y no en re-render; clic
  alterna.
- Test de `ChatView` — solo la última burbuja `model` recibe `autoSpeak`; ninguna lo
  recibe cuando el `autoSpeak` del store es `false`.

## Checklist de cierre (CLAUDE.md)

- [ ] Ningún archivo supera 250 líneas.
- [ ] Cada componente nuevo con una responsabilidad clara.
- [ ] Sin `style={{}}` inline salvo valores en runtime.
- [ ] Sin colores/espaciados/radios hardcodeados — solo tokens.
- [ ] Sin prompts fuera de `lib/ai-prompts.ts` (N/A aquí).
- [ ] Sin llamadas Supabase fuera de `lib/*/queries.ts` (N/A aquí).
- [ ] El modo offline sigue funcionando.
