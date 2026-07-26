/**
 * Node-only validation for the pronunciation content map.
 *
 * Kept separate from `content-map.ts` so client bundles that need
 * `CONTENT_MAP` / `getContentForTarget` never pull in `node:fs`.
 */

import fs from 'node:fs'
import path from 'node:path'
import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import { CONTENT_MAP, type ContentKind } from './content-map'
import { getTarget, PRONUNCIATION_TARGETS } from './registry'

export interface ContentMapIssue {
  code: 'unknown_target' | 'missing_file' | 'unknown_authored_target'
  detail: string
}

function getUnknownTargetIssues(targetIds: readonly string[], source: string): ContentMapIssue[] {
  return targetIds.flatMap((candidate) => {
    const lookup = getTarget(candidate)
    return lookup.ok
      ? []
      : [{
          code: 'unknown_authored_target' as const,
          detail: `${source} references ${lookup.error.kind} pronunciation target id "${candidate}"`,
        }]
  })
}

function getCurriculumTargetRefs(): { source: string; targetIds: readonly string[] }[] {
  return [...COURSE_PATH_CURRICULUM.levels, ...COURSE_PATH_CURRICULUM.electiveTracks].flatMap((level) =>
    level.units.flatMap((unit) =>
      unit.lessons
        .filter((lesson) => lesson.pronunciationTargetIds?.length)
        .map((lesson) => ({
          source: `curriculum lesson "${lesson.title}"`,
          targetIds: lesson.pronunciationTargetIds ?? [],
        }))
    )
  )
}

function contentDir(kind: ContentKind): string {
  return kind === 'public_lesson'
    ? path.join(process.cwd(), 'public', 'lessons')
    : path.join(process.cwd(), 'public', 'grammar-decks')
}

/**
 * Validates the content map: every target id must exist in the registry,
 * every referenced slug must exist on disk. Used by the content audit test
 * to produce zero dangling references.
 */
export function getContentMapIssues(): ContentMapIssue[] {
  const issues: ContentMapIssue[] = []

  for (const entry of CONTENT_MAP) {
    if (!PRONUNCIATION_TARGETS[entry.targetId]) {
      issues.push({
        code: 'unknown_target',
        detail: `content-map entry references unknown target id "${entry.targetId}" (slug: ${entry.slug})`,
      })
    }

    const filePath = path.join(contentDir(entry.kind), `${entry.slug}.json`)
    if (!fs.existsSync(filePath)) {
      issues.push({
        code: 'missing_file',
        detail: `content-map entry references missing ${entry.kind} file for slug "${entry.slug}"`,
      })
    }
  }

  for (const reference of getCurriculumTargetRefs()) {
    issues.push(...getUnknownTargetIssues(reference.targetIds, reference.source))
  }

  const decksDir = contentDir('grammar_deck')
  for (const file of fs.readdirSync(decksDir).filter((name) => name.endsWith('.json'))) {
    const filePath = path.join(decksDir, file)
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { pronunciationTargetIds?: unknown }
      if (Array.isArray(data.pronunciationTargetIds)) {
        issues.push(
          ...getUnknownTargetIssues(
            data.pronunciationTargetIds.filter((value): value is string => typeof value === 'string'),
            `grammar deck "${file.replace(/\.json$/, '')}"`
          )
        )
      }
    } catch {
      // Structural JSON/schema errors are reported by the grammar-deck audit.
    }
  }

  return issues
}
