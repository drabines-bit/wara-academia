import { footerConfig } from '@/config/footer'

type FooterLink = {
  label: string
  href: string
  icon: React.ReactNode
}

function buildLinks(): FooterLink[] {
  const cfg = footerConfig
  const links: (FooterLink | null)[] = [
    cfg.instagram
      ? {
          label: 'Instagram',
          href: cfg.instagram,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          ),
        }
      : null,
    cfg.linkedin
      ? {
          label: 'LinkedIn',
          href: cfg.linkedin,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          ),
        }
      : null,
    cfg.facebook
      ? {
          label: 'Facebook',
          href: cfg.facebook,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          ),
        }
      : null,
    cfg.email
      ? {
          label: cfg.email,
          href: `mailto:${cfg.email}`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          ),
        }
      : null,
    cfg.whatsapp
      ? {
          label: 'WhatsApp',
          href: `https://wa.me/${cfg.whatsapp}`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          ),
        }
      : null,
    cfg.maps.url && cfg.maps.label
      ? {
          label: cfg.maps.label,
          href: cfg.maps.url,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          ),
        }
      : null,
  ]
  return links.filter((l): l is FooterLink => l !== null)
}

export function Footer() {
  const links = buildLinks()
  const year = new Date().getFullYear()

  return (
    <footer className="hidden md:block border-t border-[var(--border)]">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-4">
        <p className="text-xs text-[var(--text-muted)]">
          © {year} {footerConfig.copyright}
        </p>
        {links.length > 0 && (
          <div className="flex items-center gap-4">
            {links.map(({ label, href, icon }) => {
              const isInternal = href.startsWith('mailto:')
              return (
                <a
                  key={label}
                  href={href}
                  {...(!isInternal && { target: '_blank', rel: 'noopener noreferrer' })}
                  aria-label={label}
                  title={label}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {icon}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </footer>
  )
}
