const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/

/** Extrae el ID de video de las distintas formas de URL de YouTube, o de un ID pelado */
export function extractYouTubeId(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  if (YOUTUBE_ID_RE.test(s)) return s

  const watch = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watch) return watch[1]

  const short = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (short) return short[1]

  const embed = s.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embed) return embed[1]

  const shorts = s.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shorts) return shorts[1]

  return null
}
