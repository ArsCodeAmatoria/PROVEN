-- COR evidence media bucket + PHOTO/VIDEO evidence source types
alter type public."CorEvidenceSourceType" add value if not exists 'PHOTO';
alter type public."CorEvidenceSourceType" add value if not exists 'VIDEO';

insert into storage.buckets (id, name, public)
values ('cor-media', 'cor-media', true)
on conflict (id) do nothing;

drop policy if exists "COR media is publicly accessible" on storage.objects;
create policy "COR media is publicly accessible"
  on storage.objects for select
  using (bucket_id = 'cor-media');

drop policy if exists "Authenticated users can upload COR media" on storage.objects;
create policy "Authenticated users can upload COR media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cor-media');

drop policy if exists "Authenticated users can update COR media" on storage.objects;
create policy "Authenticated users can update COR media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cor-media');

drop policy if exists "Authenticated users can delete COR media" on storage.objects;
create policy "Authenticated users can delete COR media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cor-media');
