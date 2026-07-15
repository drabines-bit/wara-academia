'use client'

/**
 * Saludo según la hora local del usuario. En el servidor se renderiza con la
 * hora del server; el cliente lo corrige al hidratar (suppressHydrationWarning
 * evita el warning de la diferencia de zona horaria).
 */
export function TimeGreeting() {
  const hour = new Date().getHours()
  const greeting =
    hour >= 6 && hour < 13 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return <span suppressHydrationWarning>{greeting}</span>
}
