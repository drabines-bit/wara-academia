# Setup — Academia WARA GPS

## 1. Variables de entorno

```bash
cp .env.local.example .env.local
# Completar con los valores reales de Supabase y Resend
```

## 2. Supabase — migración SQL

Pegar en el **SQL Editor** del proyecto de Supabase en este orden:

### 2.1 Enums

```sql
create type user_role       as enum ('admin', 'alumno');
create type user_status     as enum ('pending', 'approved', 'rejected');
create type complexity_level as enum ('basico', 'intermedio', 'avanzado');
create type content_type    as enum ('video', 'pdf');
```

### 2.2 Tablas

```sql
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null default '',
  role            user_role   not null default 'alumno',
  status          user_status not null default 'pending',
  preferred_theme smallint    not null default 1,
  spotify_embed_url text,
  created_at      timestamptz not null default now()
);

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table public.contents (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  complexity    complexity_level not null,
  type          content_type not null,
  title         text not null,
  description   text,
  drive_file_id text not null,
  sort_order    int  not null default 0,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

create index on public.contents (product_id, complexity, sort_order);
```

### 2.3 Trigger (crear perfil al registrarse)

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, status)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'alumno', 'pending');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 2.4 Funciones helper RLS

```sql
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_approved()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'approved');
$$;
```

### 2.5 RLS

```sql
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.contents enable row level security;

-- PROFILES
create policy "profiles_select_own"   on public.profiles for select using (id = auth.uid());
create policy "profiles_select_admin" on public.profiles for select using (public.is_admin());
create policy "profiles_update_own"   on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_update_admin" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.guard_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role or new.status is distinct from old.status then
      raise exception 'No autorizado a modificar rol o estado';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_guard_profile_fields
  before update on public.profiles
  for each row execute function public.guard_profile_fields();

-- PRODUCTS
create policy "products_select" on public.products for select using (public.is_approved() or public.is_admin());
create policy "products_admin"  on public.products for all    using (public.is_admin()) with check (public.is_admin());

-- CONTENTS
create policy "contents_select" on public.contents for select using (public.is_approved() or public.is_admin());
create policy "contents_admin"  on public.contents for all    using (public.is_admin()) with check (public.is_admin());
```

## 3. Supabase — configuración de Auth

En **Authentication → URL Configuration**:
- Site URL: `https://wara-academia.vercel.app`
- Redirect URLs: `https://wara-academia.vercel.app/auth/callback`

Para desarrollo local agregar también:
- `http://localhost:3000/auth/callback`

## 4. Sembrar admins

No hay UI para crear admins. Hacerlo directamente en Supabase:

```sql
-- Primero el usuario debe registrarse normalmente.
-- Luego actualizar su perfil:
update public.profiles
set role = 'admin', status = 'approved'
where id = '<uuid-del-usuario>';
```

## 5. Desarrollo local

```bash
npm install
cp .env.local.example .env.local
# Completar .env.local
npm run dev
```

## 6. Vercel

Variables de entorno a cargar en el dashboard de Vercel (mismas que `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `GOOGLE_DRIVE_API_KEY` (opcional, ver sección siguiente)

## 7. API key de Google Drive (opcional)

Habilita el modo "Carpeta de Drive" del importador masivo de contenidos
(`/admin/contenidos/importar`): pegás la URL de una carpeta y la app lista los
archivos, detecta el tipo por MIME y prellena los títulos.

**No requiere ser administrador de Google Workspace** — cualquier cuenta de
Google sirve, porque la API key solo lee archivos públicos ("cualquier persona
con el enlace"), que es como ya se comparten los contenidos para el embed.

1. Entrar a [console.cloud.google.com](https://console.cloud.google.com) con
   cualquier cuenta de Google.
2. Crear un proyecto (ej: `academia-wara`). Si la organización bloquea la
   creación de proyectos, usar una cuenta de Gmail personal — funciona igual.
3. **APIs y servicios → Biblioteca** → buscar **Google Drive API** → Habilitar.
4. **APIs y servicios → Credenciales → Crear credenciales → Clave de API.**
5. Restringir la clave (recomendado): en "Restricciones de API" seleccionar
   solo **Google Drive API**. No aplicar restricción de IP (Vercel usa IPs
   dinámicas).
6. Copiar la clave en `.env.local` y en Vercel como `GOOGLE_DRIVE_API_KEY`,
   y redeployar.

Requisito de Drive: las carpetas a escanear deben estar compartidas como
**"Cualquier persona con el enlace"** (los archivos heredan el permiso de la
carpeta). Las subcarpetas no se escanean recursivamente: escanear cada una
por separado.

## 8. Notificaciones y certificados

Ejecutar en el **SQL Editor de Supabase** para habilitar el módulo de
notificaciones y el certificado de finalización:

```sql
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
create policy "read own notifications" on notifications
  for select using (auth.uid() = user_id);
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

create policy "authenticated read certificate settings" on certificate_settings
  for select using (auth.role() = 'authenticated');
-- Escrituras solo desde el servidor con service_role (sin política de write).

insert into certificate_settings (id) values (true) on conflict do nothing;

-- ── Bucket público para las imágenes de firma ─────────────────────────────────
insert into storage.buckets (id, name, public)
values ('certificados', 'certificados', true)
on conflict do nothing;
```
