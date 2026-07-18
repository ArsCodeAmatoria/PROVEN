-- Employee management field extensions
alter table public.employees
  add column if not exists supervisor_id uuid references public.employees(id) on delete set null,
  add column if not exists trade text,
  add column if not exists level integer not null default 1,
  add column if not exists photo_url text,
  add column if not exists notes text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists emergency_contact_relation text;

create index if not exists employees_company_id_trade_idx on public.employees (company_id, trade);
create index if not exists employees_supervisor_id_idx on public.employees (supervisor_id);
