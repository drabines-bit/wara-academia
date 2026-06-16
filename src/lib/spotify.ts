export function toSpotifyEmbedUrl(input: string): string | null {
  const trimmed = input.trim()

  // Ya es embed URL
  if (trimmed.startsWith('https://open.spotify.com/embed/')) return trimmed

  const match = trimmed.match(
    /open\.spotify\.com\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/
  )
  if (!match) return null

  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`
}
