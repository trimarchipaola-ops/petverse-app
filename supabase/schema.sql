-- PetVerse — struttura del database
-- Da incollare in Supabase: SQL Editor → New query → Run.
-- Ogni utente vede e modifica SOLO i propri dati (Row Level Security).

-- Animali del proprietario
create table if not exists public.pets (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  species     text not null default 'cane'
              check (species in ('cane','gatto','coniglio','criceto','uccellino','rettile','altro')),
  age_years   smallint check (age_years between 0 and 40),
  created_at  timestamptz not null default now()
);

-- Promemoria (vaccini, visite, antiparassitari…)
create table if not exists public.reminders (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id      uuid not null references public.pets(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  due_date    date not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Richieste alla Guida (utili anche come dato di ricerca: quali bisogni emergono)
create table if not exists public.guide_requests (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id      uuid references public.pets(id) on delete set null,
  need        text not null,
  description text not null check (char_length(description) <= 1500),
  result      jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists reminders_owner_due on public.reminders (owner, due_date);
create index if not exists guide_requests_owner_created on public.guide_requests (owner, created_at);

alter table public.pets           enable row level security;
alter table public.reminders      enable row level security;
alter table public.guide_requests enable row level security;

-- Regole di accesso: solo il proprietario
drop policy if exists "pets: solo i miei" on public.pets;
create policy "pets: solo i miei" on public.pets
  for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "reminders: solo i miei" on public.reminders;
create policy "reminders: solo i miei" on public.reminders
  for all to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid()
              and exists (select 1 from public.pets p where p.id = pet_id and p.owner = auth.uid()));

-- Le richieste alla Guida si possono leggere e creare, non modificare
drop policy if exists "guide: leggo le mie" on public.guide_requests;
create policy "guide: leggo le mie" on public.guide_requests
  for select to authenticated using (owner = auth.uid());

drop policy if exists "guide: creo le mie" on public.guide_requests;
create policy "guide: creo le mie" on public.guide_requests
  for insert to authenticated with check (owner = auth.uid());
