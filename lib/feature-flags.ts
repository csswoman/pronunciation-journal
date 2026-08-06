// Flags de despliegue. Funciones puras sobre un env inyectable: sin estado
// global, testeables sin tocar process.env real.

type Env = Record<string, string | undefined>;

/**
 * Motor de habilidades (spec 2026-08-06). Mientras está apagado, Essential
 * Words usa la ruta `SRSData` de siempre. Se compara contra el literal
 * "true" para que un valor accidental ("0", "false", "off") nunca encienda
 * un motor a medio migrar.
 */
export function isSkillModelEnabled(env: Env = process.env): boolean {
  return env.NEXT_PUBLIC_SKILL_MODEL === "true";
}
