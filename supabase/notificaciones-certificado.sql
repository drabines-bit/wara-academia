-- ═══════════════════════════════════════════════════════════════════════════
-- Academia WARA GPS — Notificaciones y certificado de finalización
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Notificaciones ────────────────────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  href text,
  product_id uuid references products(id) on delete set null,
  kind text not null default 'admin' check (kind in ('nuevo_contenido', 'admin')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_created
  on notifications (user_id, created_at desc);

alter table notifications enable row level security;

-- Cada usuario lee y actualiza (marca como leídas) solo las suyas.
-- Los inserts se hacen desde el servidor con service_role (sin política de insert).
drop policy if exists "read own notifications" on notifications;
create policy "read own notifications" on notifications
  for select using (auth.uid() = user_id);

drop policy if exists "update own notifications" on notifications;
create policy "update own notifications" on notifications
  for update using (auth.uid() = user_id);

-- ── Configuración del certificado (fila única) ────────────────────────────────
create table if not exists certificate_settings (
  id boolean primary key default true check (id),
  disertante_name text not null default '',
  disertante_title text not null default 'Disertante',
  presidente_name text not null default '',
  presidente_title text not null default 'Presidente',
  disertante_signature_url text,
  presidente_signature_url text,
  updated_at timestamptz not null default now()
);

alter table certificate_settings enable row level security;

drop policy if exists "authenticated read certificate settings" on certificate_settings;
create policy "authenticated read certificate settings" on certificate_settings
  for select using (auth.role() = 'authenticated');
-- Escrituras solo desde el servidor con service_role (sin política de write).

insert into certificate_settings (id) values (true) on conflict do nothing;

-- ── Bucket público para las imágenes de firma ─────────────────────────────────
insert into storage.buckets (id, name, public)
values ('certificados', 'certificados', true)
on conflict do nothing;
