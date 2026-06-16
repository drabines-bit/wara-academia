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
- Site URL: `https://academia-wara.vercel.app`
- Redirect URLs: `https://academia-wara.vercel.app/auth/callback`

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
