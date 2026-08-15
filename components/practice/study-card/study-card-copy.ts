export function restatesRule(definitionEs: string | undefined, usageRuleEs: string | undefined): boolean {
  if (!definitionEs || !usageRuleEs) return false
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  return normalize(usageRuleEs).includes(normalize(definitionEs))
}

export function spanishList(items: string[]): string {
  if (items.length < 3) return items.join(' y ')
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`
}
