-- Field observation module extensions
do $$ begin
  create type public."ObservationType" as enum (
    'POSITIVE_OBSERVATION',
    'COACHING_OPPORTUNITY',
    'COMPETENT_DEMONSTRATION',
    'UNSAFE_ACT',
    'UNSAFE_CONDITION',
    'NEAR_MISS',
    'FOLLOW_UP_REQUIRED'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public."ObservationFollowUpStatus" as enum (
    'NONE',
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'CLOSED'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.observations
  add column if not exists category_id uuid references public.competency_categories(id) on delete set null,
  add column if not exists observation_type public."ObservationType",
  add column if not exists location text,
  add column if not exists comments text,
  add column if not exists corrective_actions text,
  add column if not exists due_date date,
  add column if not exists follow_up_status public."ObservationFollowUpStatus" not null default 'NONE';

-- Backfill observation_type for existing rows before enforcing not null
update public.observations
set observation_type = 'POSITIVE_OBSERVATION'
where observation_type is null;

alter table public.observations
  alter column observation_type set not null,
  alter column observation_type set default 'POSITIVE_OBSERVATION';

-- Rating becomes optional for type-first observations
alter table public.observations
  alter column rating drop not null;

alter table public.observations
  alter column notes set default '';

create index if not exists observations_company_id_observation_type_idx
  on public.observations (company_id, observation_type);

create index if not exists observations_company_id_follow_up_status_idx
  on public.observations (company_id, follow_up_status);

create index if not exists observations_employee_id_observed_at_idx
  on public.observations (employee_id, observed_at);

create index if not exists observations_category_id_idx
  on public.observations (category_id);

create index if not exists observations_competency_id_idx
  on public.observations (competency_id);

insert into storage.buckets (id, name, public)
values ('observation-media', 'observation-media', true)
on conflict (id) do nothing;

drop policy if exists "Observation media is publicly accessible" on storage.objects;
create policy "Observation media is publicly accessible"
  on storage.objects for select
  using (bucket_id = 'observation-media');

drop policy if exists "Authenticated users can upload observation media" on storage.objects;
create policy "Authenticated users can upload observation media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'observation-media');

drop policy if exists "Authenticated users can update observation media" on storage.objects;
create policy "Authenticated users can update observation media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'observation-media');

drop policy if exists "Authenticated users can delete observation media" on storage.objects;
create policy "Authenticated users can delete observation media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'observation-media');
