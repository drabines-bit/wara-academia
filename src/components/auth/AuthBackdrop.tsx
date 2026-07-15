/**
 * Fondo "mapa vivo" para las pantallas de auth: retícula de mapa tenue y
 * rutas punteadas con unidades recorriéndolas — el producto de WARA contado
 * en el fondo del login. SVG + SMIL, sin JavaScript; los puntos móviles se
 * ocultan con prefers-reduced-motion.
 */
export function AuthBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Retícula de mapa, desvanecida hacia los bordes */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(color-mix(in srgb, var(--border) 60%, transparent) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage:
            'radial-gradient(ellipse 95% 85% at 50% 45%, black 25%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 95% 85% at 50% 45%, black 25%, transparent 78%)',
        }}
      />

      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* Rutas */}
        <g
          fill="none"
          stroke="var(--text-muted)"
          strokeOpacity="0.28"
          strokeWidth="1.5"
          strokeDasharray="2 8"
          strokeLinecap="round"
        >
          <path
            id="ruta-norte"
            d="M -60 150 H 320 Q 368 150 392 189 L 486 340 Q 510 379 558 379 H 1010 Q 1058 379 1082 340 L 1210 132 Q 1234 93 1282 93 H 1500"
          />
          <path
            id="ruta-sur"
            d="M 1500 705 H 1120 Q 1072 705 1048 666 L 972 544 Q 948 505 900 505 H 470 Q 422 505 398 544 L 300 702 Q 276 741 228 741 H -60"
          />
        </g>

        {/* Paradas (esquinas de las rutas) */}
        <g fill="var(--text-muted)" fillOpacity="0.35">
          <circle cx="320" cy="150" r="3" />
          <circle cx="1010" cy="379" r="3" />
          <circle cx="1282" cy="93" r="3" />
          <circle cx="1120" cy="705" r="3" />
          <circle cx="470" cy="505" r="3" />
          <circle cx="228" cy="741" r="3" />
        </g>

        {/* Unidades en movimiento (ocultas si el usuario prefiere menos movimiento) */}
        <g fill="var(--accent)" className="motion-reduce:hidden">
          <circle r="9" fillOpacity="0.15">
            <animateMotion dur="34s" repeatCount="indefinite">
              <mpath href="#ruta-norte" />
            </animateMotion>
          </circle>
          <circle r="3.5">
            <animateMotion dur="34s" repeatCount="indefinite">
              <mpath href="#ruta-norte" />
            </animateMotion>
          </circle>
        </g>
        <g fill="var(--accent)" className="motion-reduce:hidden">
          <circle r="9" fillOpacity="0.15">
            <animateMotion dur="46s" begin="-18s" repeatCount="indefinite">
              <mpath href="#ruta-sur" />
            </animateMotion>
          </circle>
          <circle r="3.5">
            <animateMotion dur="46s" begin="-18s" repeatCount="indefinite">
              <mpath href="#ruta-sur" />
            </animateMotion>
          </circle>
        </g>
      </svg>
    </div>
  )
}
