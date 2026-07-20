-- Lista de espera de la landing "próximamente".
-- Correr una vez en el SQL Editor de Supabase (proyecto de Eagle Club).

create table if not exists public.waitlist (
  id          text primary key,
  name        text not null,
  email       text not null,
  phone       text,
  source      text,
  created_at  timestamptz not null default now()
);

-- Un email por persona: el insert duplicado devuelve 23505 y la ruta
-- lo traduce a "Ese email ya está en la lista.".
create unique index if not exists waitlist_email_key
  on public.waitlist (lower(email));

create index if not exists waitlist_created_at_idx
  on public.waitlist (created_at desc);

-- RLS activo y SIN políticas: nadie con la anon key puede leer ni escribir.
-- Solo el service_role (que omite RLS) entra, y ese vive únicamente en el
-- servidor. Los datos de la lista son PII.
alter table public.waitlist enable row level security;
