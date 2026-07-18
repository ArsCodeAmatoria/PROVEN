-- Competency library field extensions
do $$ begin
  create type public."CompetencyDifficulty" as enum (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'EXPERT'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.competencies
  add column if not exists reference text,
  add column if not exists csa_reference text,
  add column if not exists asme_reference text,
  add column if not exists worksafe_bc_reference text,
  add column if not exists required_demonstrations text,
  add column if not exists required_score integer,
  add column if not exists difficulty public."CompetencyDifficulty" not null default 'INTERMEDIATE',
  add column if not exists estimated_time_minutes integer;

create index if not exists competencies_company_id_difficulty_idx
  on public.competencies (company_id, difficulty);

-- Competency attachments storage
insert into storage.buckets (id, name, public)
values ('competency-documents', 'competency-documents', true)
on conflict (id) do nothing;

drop policy if exists "Competency documents are publicly accessible" on storage.objects;
create policy "Competency documents are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'competency-documents');

drop policy if exists "Authenticated users can upload competency documents" on storage.objects;
create policy "Authenticated users can upload competency documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'competency-documents');

drop policy if exists "Authenticated users can update competency documents" on storage.objects;
create policy "Authenticated users can update competency documents"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'competency-documents');

drop policy if exists "Authenticated users can delete competency documents" on storage.objects;
create policy "Authenticated users can delete competency documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'competency-documents');
