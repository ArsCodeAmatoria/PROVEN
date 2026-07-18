-- Competency assessment engine extensions
do $$ begin
  create type public."AssessmentRating" as enum (
    'PASS',
    'NEEDS_IMPROVEMENT',
    'COMPETENT',
    'EXCEEDS_STANDARD',
    'NOT_OBSERVED'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public."AssessmentSignerRole" as enum (
    'INSTRUCTOR',
    'APPRENTICE',
    'WITNESS'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.assessment_results
  add column if not exists rating public."AssessmentRating",
  add column if not exists comments text,
  add column if not exists instructor_notes text,
  add column if not exists apprentice_comments text,
  add column if not exists locked_at timestamptz;

create index if not exists assessment_results_employee_id_rating_idx
  on public.assessment_results (employee_id, rating);

create index if not exists assessment_results_assessed_at_idx
  on public.assessment_results (assessed_at);

create table if not exists public.assessment_signatures (
  id                   uuid primary key default gen_random_uuid(),
  assessment_result_id uuid not null references public.assessment_results(id) on delete cascade,
  signer_employee_id   uuid references public.employees(id) on delete set null,
  role                 public."AssessmentSignerRole" not null,
  signer_name          text not null,
  signed_at            timestamptz not null default now(),
  storage_path         text,
  signature_url        text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid,
  deleted_at           timestamptz
);

create index if not exists assessment_signatures_result_id_idx
  on public.assessment_signatures (assessment_result_id);

create index if not exists assessment_signatures_signer_employee_id_idx
  on public.assessment_signatures (signer_employee_id);

create index if not exists assessment_signatures_deleted_at_idx
  on public.assessment_signatures (deleted_at);

drop trigger if exists set_assessment_signatures_updated_at on public.assessment_signatures;
create trigger set_assessment_signatures_updated_at
  before update on public.assessment_signatures
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('assessment-media', 'assessment-media', true)
on conflict (id) do nothing;

drop policy if exists "Assessment media is publicly accessible" on storage.objects;
create policy "Assessment media is publicly accessible"
  on storage.objects for select
  using (bucket_id = 'assessment-media');

drop policy if exists "Authenticated users can upload assessment media" on storage.objects;
create policy "Authenticated users can upload assessment media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'assessment-media');

drop policy if exists "Authenticated users can update assessment media" on storage.objects;
create policy "Authenticated users can update assessment media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'assessment-media');

drop policy if exists "Authenticated users can delete assessment media" on storage.objects;
create policy "Authenticated users can delete assessment media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'assessment-media');
