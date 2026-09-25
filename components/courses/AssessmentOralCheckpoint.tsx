"use client";

// Planned structure:
// <AssessmentOralCheckpoint>
//   <OralTaskPrompt />
//   <RecordingControls />
//   <AudioPreview />
//   <OralEvidenceFeedback />
// </AssessmentOralCheckpoint>

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Mic, RefreshCw } from "@/components/icons";
import { PillButton } from "@/components/ui/PillButton";
import PastelCard from "@/components/layout/PastelCard";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import type { AssessmentResult } from "@/lib/courses/assessment";
import { AssessmentPayloadSchema } from "@/lib/courses/assessment-schema";
import type { AssessmentOralPilotLevel, AssessmentOralChallenge } from "@/lib/courses/assessment-oral-shared";
import { ASSESSMENT_ORAL_RECORDING_MAX_MS } from "@/lib/courses/assessment-oral-shared";

interface AssessmentOralCheckpointProps {
  level: AssessmentOralPilotLevel;
  attemptId: string;
  initialChallenge?: AssessmentOralChallenge | null;
  onComplete: (result: AssessmentResult) => void;
  onDefer: (attemptId: string) => Promise<void>;
}

export function AssessmentOralCheckpoint({
  level,
  attemptId,
  initialChallenge = null,
  onComplete,
  onDefer,
}: AssessmentOralCheckpointProps) {
  const recorder = useVoiceRecorder();
  const [challenge, setChallenge] = useState<AssessmentOralChallenge | null>(initialChallenge);
  const [challengeLoading, setChallengeLoading] = useState(!initialChallenge);
  const [submitting, setSubmitting] = useState(false);
  const [deferLoading, setDeferLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const issueChallenge = useCallback(async (): Promise<boolean> => {
    setChallengeLoading(true);
    setMessage(null);
    setChallenge(null);
    recorder.reset();
    try {
      const response = await fetch("/api/assessment/oral/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, assessmentAttemptId: attemptId }),
      });
      const body = await response.json().catch(() => null) as {
        attemptId?: string;
        challenge?: AssessmentOralChallenge;
      } | null;
      if (!response.ok || !body?.challenge) throw new Error("No se pudo iniciar la tarea oral.");
      setChallenge(body.challenge);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar la tarea oral.");
      return false;
    } finally {
      setChallengeLoading(false);
    }
  }, [attemptId, level, recorder.reset]);

  useEffect(() => {
    if (!initialChallenge) void issueChallenge();
    return () => recorder.reset();
  }, [initialChallenge, issueChallenge, recorder.reset]);

  useEffect(() => {
    if (recorder.state !== "recording") return;
    setElapsedMs(0);
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    const timeoutId = window.setTimeout(recorder.stop, ASSESSMENT_ORAL_RECORDING_MAX_MS);
    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [recorder.state, recorder.stop]);

  async function startRecording() {
    setMessage(null);
    try {
      await recorder.start();
      if (recorder.state === "error") setMessage("No se pudo acceder al micrófono. Revisa sus permisos e inténtalo otra vez.");
    } catch {
      setMessage("No se pudo acceder al micrófono. Revisa sus permisos e inténtalo otra vez.");
    }
  }

  async function submitRecording() {
    if (!challenge || !recorder.result || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const formData = new FormData();
      const extension = recorder.result.blob.type.includes("mp4") ? "m4a" : "webm";
      formData.append("attemptId", attemptId);
      formData.append("challengeId", challenge.id);
      formData.append("audio", recorder.result.blob, `checkpoint.${extension}`);
      const response = await fetch("/api/assessment/oral/evidence", {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(65_000),
      });
      const body = await response.json().catch(() => null) as {
        passed?: boolean;
        processing?: boolean;
        retryable?: boolean;
        message?: string;
        result?: unknown;
        error?: string;
      } | null;
      if (response.ok && body?.passed && body.result) {
        const parsed = AssessmentPayloadSchema.safeParse(body.result);
        if (!parsed.success) throw new Error("El resultado oral recibido no es válido.");
        onComplete(parsed.data as AssessmentResult);
        return;
      }
      if (response.status === 202 && body?.processing) {
        setMessage(body.message ?? "El audio sigue en evaluación. Vuelve a consultar en un momento.");
        return;
      }
      if (body?.retryable) {
        const renewed = await issueChallenge();
        if (renewed) setMessage(body.message ?? "No se pudieron confirmar los detalles. Graba otra respuesta.");
        return;
      }
      if (response.status === 409 || response.status === 410) {
        const renewed = await issueChallenge();
        if (renewed) setMessage("El reto venció o ya se había usado. Preparamos uno nuevo para este mismo intento.");
        return;
      }
      setMessage(body?.error ?? body?.message ?? "No se pudo comprobar el audio. Tu checkpoint sigue pendiente.");
    } catch (error) {
      setMessage(error instanceof Error && error.name === "TimeoutError"
        ? "La evaluación tardó demasiado. Tu audio sigue disponible para reintentar."
        : error instanceof Error ? error.message : "No se pudo comprobar el audio.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deferAttempt() {
    setDeferLoading(true);
    try {
      await onDefer(attemptId);
    } catch {
      setMessage("No se pudo guardar el resultado parcial. Tus respuestas siguen vinculadas a este intento.");
    } finally {
      setDeferLoading(false);
    }
  }

  const elapsedSeconds = Math.min(15, Math.floor(elapsedMs / 1000));
  const recording = recorder.state === "recording";

  return (
    <section className="flex w-full flex-col gap-5" aria-labelledby="assessment-oral-title" aria-busy={submitting || challengeLoading}>
      <PastelCard tone="sky" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="font-kicker text-ink-muted">Checkpoint {level.toUpperCase()} · tarea oral</p>
          <h2 id="assessment-oral-title" className="font-display text-h3 font-extrabold tracking-tight text-balance text-ink">
            Di una respuesta breve en inglés
          </h2>
          <p className="text-body-sm text-ink-secondary">
            Tu avance escrito y de escucha queda guardado.
          </p>
        </div>

        {challengeLoading ? (
          <p role="status" className="text-body-sm text-ink-secondary">Preparando una tarea para este intento…</p>
        ) : challenge ? (
          <div className="pastel-card-inset rounded-xl p-4">
            <p className="text-body font-medium text-ink">{challenge.prompt}</p>
            <p className="mt-2 text-caption text-ink-muted">Graba hasta 15 s; puedes escuchar antes de enviar.</p>
          </div>
        ) : (
          <div role="alert" className="flex items-start gap-2 text-body-sm text-ink-secondary">
            <AlertCircle size={18} aria-hidden />
            <span>{message ?? "No se pudo preparar la tarea. Puedes reintentarlo."}</span>
          </div>
        )}

        {challenge && (
          <details className="max-w-prose text-body-sm text-ink-muted">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold text-ink-secondary focus-ring">
              Google Gemini transcribe el audio · Ver privacidad
            </summary>
            <p className="pb-2 leading-relaxed">
              Al enviarlo, Google Gemini recibe el audio para transcribirlo. Google puede retenerlo hasta 55 días por seguridad y, en el servicio sin pago, usarlo para mejorar sus productos y permitir revisión humana. English Journal no guarda el audio ni la transcripción. Usa solo los datos ficticios de la consigna; no compartas información personal. Consulta la{" "}
              <a className="underline underline-offset-2" href="/privacy">política de privacidad</a>.
            </p>
          </details>
        )}

        {!recorder.isSupported && !challengeLoading && (
          <p role="status" className="pastel-card-inset rounded-xl p-4 text-body-sm text-ink-secondary">
            Este dispositivo no ofrece grabación compatible. Tu examen sigue pendiente; vuelve a este checkpoint desde un dispositivo con micrófono.
          </p>
        )}

        {recorder.isSupported && challenge && (
          <div className="flex flex-wrap items-center gap-3">
            {recording ? (
              <PillButton variant="primary" size="md" className="min-h-11 px-5" onClick={recorder.stop}>
                Detener · {elapsedSeconds}s
              </PillButton>
            ) : (
              <PillButton variant={recorder.result ? "outline" : "primary"} size="md" className="min-h-11 px-5" onClick={() => void startRecording()} disabled={submitting}>
                <Mic size={18} aria-hidden />
                {recorder.result ? "Grabar otra vez" : "Grabar respuesta"}
              </PillButton>
            )}
            {recorder.result && !recording && (
              <PillButton variant="primary" size="md" className="min-h-11 px-5" onClick={() => void submitRecording()} disabled={submitting} isLoading={submitting}>
                {submitting ? "Evaluando audio…" : "Enviar audio"}
              </PillButton>
            )}
            {recorder.result && !recording && (
              <audio controls preload="metadata" src={recorder.result.url} aria-label="Escuchar la respuesta grabada" />
            )}
          </div>
        )}

        {recorder.state === "error" && (
          <p role="alert" className="text-body-sm text-ink-secondary">No pudimos abrir el micrófono. Revisa los permisos del navegador.</p>
        )}
        {message && challenge && <p role="alert" className="text-body-sm text-ink-secondary">{message}</p>}
      </PastelCard>

      <div className="flex flex-wrap items-center gap-3">
        {!challenge && recorder.isSupported && (
          <PillButton variant="outline" size="md" className="min-h-11 px-5" onClick={() => void issueChallenge()} disabled={challengeLoading}>
            <RefreshCw size={16} aria-hidden />
            Reintentar tarea
          </PillButton>
        )}
        <PillButton variant="quiet" size="md" className="min-h-11 px-4" onClick={() => void deferAttempt()} disabled={deferLoading}>
          Dejar para después
        </PillButton>
        <p className="text-caption text-text-muted">Puedes retomarlo desde otro dispositivo durante 24 h.</p>
      </div>
    </section>
  );
}
