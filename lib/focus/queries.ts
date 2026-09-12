/**
 * lib/focus/queries.ts
 *
 * CRUD para Focus Mode: sprints y contenido generado por Gemini.
 * Patrón offline-first: escribe en Dexie primero, encola sync al outbox.
 * Lectura: Dexie como fuente de verdad local.
 */

import Dexie from 'dexie'
import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import type { FocusSprint, FocusContent, SprintGap, FocusContentKind, FocusMediaUrls } from './types'

// ── Sprint ─────────────────────────────────────────────────────────────────────

/** Sprint activo del usuario, o undefined si no tiene ninguno. */
export async function getActiveSprint(userId: string): Promise<FocusSprint | undefined> {
  return db.focusSprints
    .where('[userId+status]')
    .equals([userId, 'active'])
    .first()
}

/** Todos los sprints del usuario, más reciente primero. */
export async function listSprints(userId: string): Promise<FocusSprint[]> {
  const rows = await db.focusSprints.where('userId').equals(userId).toArray()
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * Crea un sprint activo de N días (default 7).
 * Escribe en Dexie y encola el insert al outbox para sync a Supabase.
 */
export async function createSprint(
  userId: string,
  gaps: SprintGap[],
  durationDays = 7,
): Promise<FocusSprint> {
  const now = new Date()
  const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

  const sprint: FocusSprint = {
    id: crypto.randomUUID(),
    gaps,
    startsAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    status: 'active',
    createdAt: now.toISOString(),
  }

  await db.transaction('rw', [db.focusSprints, db.syncOutbox], async () => {
    await db.focusSprints.put(sprint)
    await enqueue(userId, 'focus_sprints', 'insert', {
      id: sprint.id,
      user_id: userId,
      gaps: gaps,
      starts_at: sprint.startsAt,
      ends_at: sprint.endsAt,
      status: sprint.status,
      created_at: sprint.createdAt,
    })
  })

  return sprint
}

/** Marca un sprint como completed o expired. */
export async function updateSprintStatus(
  sprintId: string,
  userId: string,
  status: 'completed' | 'expired',
): Promise<void> {
  await db.transaction('rw', [db.focusSprints, db.syncOutbox], async () => {
    await db.focusSprints.update(sprintId, { status })
    await enqueue(userId, 'focus_sprints', 'update', { status }, { id: sprintId })
  })
}

/**
 * Borra un sprint que nunca llegó a tener contenido.
 *
 * Existe para el rollback del setup: si la generación del primer asset falla,
 * el sprint ya está escrito en Dexie y, sin esto, queda activo y vacío. La
 * siguiente visita a /focus/setup redirigiría a un sprint sin nada dentro.
 */
export async function deleteSprint(sprintId: string, userId: string): Promise<void> {
  await db.transaction('rw', [db.focusSprints, db.syncOutbox], async () => {
    await db.focusSprints.delete(sprintId)
    await enqueue(userId, 'focus_sprints', 'delete', {}, { id: sprintId })
  })
}

// ── Focus Content ──────────────────────────────────────────────────────────────

/** Todos los assets de un sprint, ordenados por fecha de creación. */
export async function listSprintContent(sprintId: string): Promise<FocusContent[]> {
  const rows = await db.focusContent
    .where('[sprintId+kind]')
    .between([sprintId, Dexie.minKey], [sprintId, Dexie.maxKey])
    .toArray()
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** Primer asset de un sprint y kind concreto, o undefined. */
export async function getSprintContentByKind(
  sprintId: string,
  kind: FocusContentKind,
): Promise<FocusContent | undefined> {
  return db.focusContent
    .where('[sprintId+kind]')
    .equals([sprintId, kind])
    .first()
}

/** Asset por id. */
export async function getFocusContentById(id: string): Promise<FocusContent | undefined> {
  return db.focusContent.get(id)
}

/**
 * Guarda un asset generado por Gemini (offline-first + outbox).
 * Los ejercicios derivados viajan dentro del mismo registro.
 */
export async function saveFocusContent(
  content: FocusContent,
  userId: string,
): Promise<void> {
  await db.transaction('rw', [db.focusContent, db.syncOutbox], async () => {
    await db.focusContent.put(content)
    await enqueue(userId, 'focus_content', 'insert', {
      id: content.id,
      sprint_id: content.sprintId,
      user_id: userId,
      kind: content.kind,
      gap_ids: content.gapIds,
      body: content.body,
      exercises: content.exercises,
      audio_narration_url: content.media.audioNarrationUrl,
      audio_sentences_urls: content.media.audioSentencesUrls,
      image_scene_url: content.media.imageSceneUrl,
      image_prompt_url: content.media.imagePromptUrl,
      video_clip_url: content.media.videoClipUrl,
      created_at: content.createdAt,
    })
  })
}

/**
 * Actualiza las URLs de media de un asset.
 * Se llama cuando la creadora sube archivos al bucket focus-media desde
 * Supabase Studio y quiere vincularlos a este contenido.
 */
export async function updateFocusContentMedia(
  contentId: string,
  userId: string,
  mediaPatch: Partial<FocusMediaUrls>,
): Promise<void> {
  const existing = await db.focusContent.get(contentId)
  if (!existing) return

  const merged: FocusMediaUrls = { ...existing.media, ...mediaPatch }

  await db.transaction('rw', [db.focusContent, db.syncOutbox], async () => {
    await db.focusContent.update(contentId, { media: merged })
    await enqueue(userId, 'focus_content', 'update', {
      audio_narration_url: merged.audioNarrationUrl,
      audio_sentences_urls: merged.audioSentencesUrls,
      image_scene_url: merged.imageSceneUrl,
      image_prompt_url: merged.imagePromptUrl,
      video_clip_url: merged.videoClipUrl,
    }, { id: contentId })
  })
}
