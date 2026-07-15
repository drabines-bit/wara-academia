-- ═══════════════════════════════════════════════════════════════════════════
-- Academia WARA GPS — Contenido de YouTube embebido
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── drive_file_id → external_id (ahora guarda un ID de Drive o de YouTube) ────
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contents' and column_name = 'drive_file_id'
  ) then
    alter table public.contents rename column drive_file_id to external_id;
  end if;
end $$;

-- ── Fuente del contenido ──────────────────────────────────────────────────────
alter table public.contents add column if not exists source text not null default 'drive';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contents_source_check') then
    alter table public.contents
      add constraint contents_source_check check (source in ('drive', 'youtube'));
  end if;
end $$;

-- Un video de YouTube siempre se visualiza como 'video'
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contents_youtube_is_video_check') then
    alter table public.contents
      add constraint contents_youtube_is_video_check check (source <> 'youtube' or type = 'video');
  end if;
end $$;
