import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const sourcePath = resolve('tmp/chunk-metadata/chunks-learning-metadata.json')
const targetPath = resolve('lib/chunk-of-day/learning-metadata.json')

function normalize(text) {
  return text
    .toLocaleLowerCase('en')
    .replace(/[’'ʼ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const rows = JSON.parse(await readFile(sourcePath, 'utf8'))
const normalized = rows.map((row) => ({
  ...row,
  learning: {
    ...row.learning,
    acceptedAnswers: row.learning.acceptedAnswers.filter(
      (answer) => normalize(answer) !== normalize(row.learning.coreText),
    ),
  },
}))

await writeFile(targetPath, `${JSON.stringify(normalized, null, 2)}\n`)
console.log(`Imported ${normalized.length} chunk metadata rows into ${targetPath}`)
