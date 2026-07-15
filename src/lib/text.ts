// Normaliza para buscar sin distinción de acentos ni mayúsculas
export function normalizeForSearch(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function matchesQuery(haystack: string, query: string) {
  const q = normalizeForSearch(query.trim())
  if (!q) return true
  const tokens = q.split(/\s+/)
  const normalized = normalizeForSearch(haystack)
  return tokens.every((t) => normalized.includes(t))
}
