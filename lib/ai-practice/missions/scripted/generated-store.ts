'use client'

import { db } from '@/lib/db'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { ScriptedMission } from '../types'
import { registerDynamicMission } from '../registry'

interface RawScriptLine {
  speaker: 'coach' | 'learner'
  text: string
}

/**
 * Convierte la respuesta del modelo en una misión ejecutable y la guarda.
 *
 * Persistir es lo que permite repetir el guión sin volver a llamar a la API,
 * y que funcione offline la segunda vez.
 */
export async function saveGeneratedScript(
  userId: string,
  topic: string,
  cefr: CEFRLevel,
  lines: RawScriptLine[],
): Promise<ScriptedMission> {
  const id = `generated.${globalThis.crypto.randomUUID()}`

  const mission: ScriptedMission = {
    id,
    mode: 'scripted',
    origin: 'generated',
    category: 'social',
    recommendedCefr: cefr,
    context: topic,
    communicativeGoal: `Practicar un diálogo sobre ${topic}.`,
    targets: [],
    script: lines.map((line, index) => ({
      id: `${id}:${index}`,
      speaker: line.speaker,
      text: line.text,
    })),
  }

  await db.generatedScripts.put({
    id,
    userId,
    mission,
    topic,
    createdAt: new Date().toISOString(),
  })

  registerDynamicMission(mission)
  return mission
}

/** Guiones generados del usuario, del más reciente al más antiguo. */
export async function listGeneratedScripts(userId: string): Promise<ScriptedMission[]> {
  const rows = await db.generatedScripts.where('userId').equals(userId).toArray()
  const list = rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((row) => row.mission)
  list.forEach(registerDynamicMission)
  return list
}
