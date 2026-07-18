-- Employee profile photos storage
insert into storage.buckets (id, name, public)
values ('employee-photos', 'employee-photos', true)
on conflict (id) do nothing;

drop policy if exists "Employee photos are publicly accessible" on storage.objects;
create policy "Employee photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'employee-photos');

drop policy if exists "Authenticated users can upload employee photos" on storage.objects;
create policy "Authenticated users can upload employee photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'employee-photos');

drop policy if exists "Authenticated users can update employee photos" on storage.objects;
create policy "Authenticated users can update employee photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'employee-photos');

drop policy if exists "Authenticated users can delete employee photos" on storage.objects;
create policy "Authenticated users can delete employee photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'employee-photos');
