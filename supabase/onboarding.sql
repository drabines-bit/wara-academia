-- ═══════════════════════════════════════════════════════════════════════════
-- Academia WARA GPS — Onboarding: curso obligatorio + pantalla de bienvenida
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Flag de curso obligatorio ─────────────────────────────────────────────────
alter table products add column if not exists is_mandatory boolean not null default false;

-- Marcar el curso de Términos y Condiciones como obligatorio
update products set is_mandatory = true
where slug = 'terminos-y-condiciones-del-servicio';

-- ── Pantalla de bienvenida (fila única, editable desde el admin) ──────────────
create table if not exists welcome_settings (
  id boolean primary key default true check (id),
  title text not null default '¡Bienvenido a la Academia WARA!',
  body text not null default '',
  updated_at timestamptz not null default now()
);

alter table welcome_settings enable row level security;

drop policy if exists "authenticated read welcome settings" on welcome_settings;
create policy "authenticated read welcome settings" on welcome_settings
  for select using (auth.role() = 'authenticated');
-- Escrituras solo desde el servidor con service_role (sin política de write).

insert into welcome_settings (id, title, body) values (
  true,
  '¡Bienvenido a la Academia WARA!',
  $bienvenida$WARA es la plataforma de rastreo y gestión de flotas que usás todos los días. Esta academia es su espacio de capacitación oficial: acá vas a encontrar videos, manuales y material descargable para sacarle el máximo provecho a cada producto que tenés contratado.

El objetivo es simple: que puedas resolver en el momento, sin depender de soporte — desde la instalación de un equipo hasta la interpretación de un reporte.

Tené en cuenta que este material es de uso exclusivo para clientes de WARA: los contenidos no reemplazan las recomendaciones del fabricante ni los procedimientos de seguridad de tu empresa, y no está permitido compartirlos fuera de la plataforma.

Antes de empezar, necesitamos que completes el curso de Términos y Condiciones del Servicio. Es obligatorio y solo te va a llevar unos minutos: al finalizarlo se desbloquea el resto de los cursos.$bienvenida$
)
on conflict do nothing;
