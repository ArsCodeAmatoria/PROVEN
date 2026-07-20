-- Company files library: folders + document folder_id + storage bucket

create table if not exists public.company_folders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  parent_id uuid references public.company_folders(id) on delete restrict,
  name text not null,
  created_at timestamptz(6) not null default now(),
  updated_at timestamptz(6) not null default now(),
  created_by uuid,
  deleted_at timestamptz(6)
);

create index if not exists company_folders_company_id_parent_id_idx
  on public.company_folders (company_id, parent_id);
create index if not exists company_folders_deleted_at_idx
  on public.company_folders (deleted_at);

alter table public.documents
  add column if not exists folder_id uuid references public.company_folders(id) on delete set null;

create index if not exists documents_company_id_folder_id_idx
  on public.documents (company_id, folder_id);

insert into storage.buckets (id, name, public)
values ('company-files', 'company-files', true)
on conflict (id) do nothing;

drop policy if exists "Company files are publicly accessible" on storage.objects;
create policy "Company files are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'company-files');

drop policy if exists "Authenticated users can upload company files" on storage.objects;
create policy "Authenticated users can upload company files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'company-files');

drop policy if exists "Authenticated users can update company files" on storage.objects;
create policy "Authenticated users can update company files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'company-files');

drop policy if exists "Authenticated users can delete company files" on storage.objects;
create policy "Authenticated users can delete company files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'company-files');
