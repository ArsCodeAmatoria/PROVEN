-- Practical demonstration required count on competencies
alter table public.competencies
  add column if not exists required_demonstration_count integer;

create index if not exists competencies_required_demonstration_count_idx
  on public.competencies (required_demonstration_count)
  where required_demonstration_count is not null;
