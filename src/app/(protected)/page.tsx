// Redirige a /contenido — el layout ya verificó la sesión
import { redirect } from 'next/navigation'

export default function ProtectedRoot() {
  redirect('/contenido')
}
