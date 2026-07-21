-- ═══════════════════════════════════════════════════════════════════════════
-- Academia WARA GPS — Feed de novedades (por categoría, con audiencia y notificación)
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Audiencia del usuario: cliente vs. empleado ───────────────────────────────
-- Se calcula automáticamente al aprobar (dominio @waragps.com → tag "warapeople"
-- en Odoo → default "cliente"), pero el admin puede sobrescribirla a mano desde
-- el panel de Usuarios. Determina qué novedades ve cada quien (ver policy más abajo).
alter table public.profiles
  add column if not exists audience text not null default 'cliente';

alter table public.profiles drop constraint if exists profiles_audience_check;
alter table public.profiles
  add constraint profiles_audience_check check (audience in ('cliente', 'empleado'));

-- ── Tabla de novedades ─────────────────────────────────────────────────────────
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'general',
  -- 'todos' | 'cliente' | 'empleado' — mismos valores que profiles.audience
  -- (salvo el comodín 'todos') para que la policy de lectura sea una comparación directa.
  audience text not null default 'todos',
  product_id uuid references public.products(id) on delete set null,
  publish_at timestamptz not null default now(),
  -- Se completa cuando el cron ya hizo el fan-out a "notifications" para esta
  -- novedad; null = todavía no se notificó (pendiente o recién publicada).
  notified_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.news drop constraint if exists news_category_check;
alter table public.news
  add constraint news_category_check check (category in ('feature', 'producto', 'empleados', 'general'));

alter table public.news drop constraint if exists news_audience_check;
alter table public.news
  add constraint news_audience_check check (audience in ('todos', 'cliente', 'empleado'));

create index if not exists news_publish_at_idx on public.news (publish_at desc);
create index if not exists news_pending_notify_idx on public.news (publish_at) where notified_at is null;

alter table public.news enable row level security;

drop policy if exists "news_select" on public.news;
create policy "news_select" on public.news
  for select using (
    public.is_admin()
    or (
      public.is_approved()
      and publish_at <= now()
      and (
        audience = 'todos'
        or audience = (select p.audience from public.profiles p where p.id = auth.uid())
      )
    )
  );

drop policy if exists "news_admin" on public.news;
create policy "news_admin" on public.news
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Notifications: nuevo kind "novedad" ───────────────────────────────────────
-- Para que el fan-out de novedades pueda insertar en la campanita existente.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check check (kind in ('nuevo_contenido', 'admin', 'novedad'));
