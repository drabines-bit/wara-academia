-- ═══════════════════════════════════════════════════════════════════════════
-- Academia WARA GPS — Contenido de sitio web embebido (además de Drive/YouTube)
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Sacar de en medio las constraints que referencian "type" ──────────────────
-- contents_youtube_is_video_check (creada en contenido-youtube.sql) compara
-- "type = 'video'" con el enum original todavía baked-in; si no la sacamos
-- antes, ALTER COLUMN TYPE falla con "operator does not exist: text = content_type".
alter table public.contents drop constraint if exists contents_youtube_is_video_check;
alter table public.contents drop constraint if exists contents_type_check;
alter table public.contents drop constraint if exists contents_web_is_web_check;

-- ── "type" a text + check (si todavía es el enum original) ───────────────────
-- El enum "content_type" nunca quedó documentado con sus valores reales
-- ('audio'/'otro' se agregaron a mano en algún momento). Lo pasamos a texto +
-- check, mismo patrón que ya usa "source", para que quede todo trackeado acá.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contents'
      and column_name = 'type' and data_type = 'USER-DEFINED'
  ) then
    alter table public.contents alter column type type text using type::text;
  end if;
end $$;

alter table public.contents
  add constraint contents_type_check check (type in ('video', 'pdf', 'audio', 'otro', 'web'));

-- ── Fuente "web": permitir el nuevo valor ─────────────────────────────────────
alter table public.contents drop constraint if exists contents_source_check;
alter table public.contents
  add constraint contents_source_check check (source in ('drive', 'youtube', 'web'));

-- ── Recrear las constraints que relacionan source ↔ type ──────────────────────
alter table public.contents
  add constraint contents_youtube_is_video_check check (source <> 'youtube' or type = 'video');

alter table public.contents
  add constraint contents_web_is_web_check check (source <> 'web' or type = 'web');
