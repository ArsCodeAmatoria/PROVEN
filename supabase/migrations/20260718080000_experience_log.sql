-- Experience log entries + company competency hour milestones

do $$ begin
  create type "LiftType" as enum (
    'NONE',
    'MOBILE_CRANE',
    'TOWER_CRANE',
    'OVERHEAD_CRANE',
    'BOOM_TRUCK',
    'FORKLIFT',
    'AERIAL_LIFT',
    'OTHER'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "ExperienceMilestoneKind" as enum (
    'APPRENTICESHIP',
    'EQUIPMENT',
    'PROJECT',
    'CATEGORY',
    'GENERAL'
  );
exception when duplicate_object then null;
end $$;

create table if not exists experience_log_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  project_id uuid not null references projects(id) on delete restrict,
  supervisor_id uuid references employees(id) on delete set null,
  equipment_id uuid references equipment(id) on delete set null,
  category_id uuid references competency_categories(id) on delete set null,
  competency_id uuid references competencies(id) on delete set null,
  employer_name text not null,
  lift_type "LiftType" not null default 'NONE',
  task_performed text not null,
  hours numeric(8, 2) not null,
  start_date date not null,
  end_date date not null,
  is_apprenticeship boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index if not exists experience_log_entries_company_id_start_date_idx
  on experience_log_entries (company_id, start_date);
create index if not exists experience_log_entries_employee_id_start_date_idx
  on experience_log_entries (employee_id, start_date);
create index if not exists experience_log_entries_project_id_idx
  on experience_log_entries (project_id);
create index if not exists experience_log_entries_equipment_id_idx
  on experience_log_entries (equipment_id);
create index if not exists experience_log_entries_category_id_idx
  on experience_log_entries (category_id);
create index if not exists experience_log_entries_supervisor_id_idx
  on experience_log_entries (supervisor_id);
create index if not exists experience_log_entries_lift_type_idx
  on experience_log_entries (lift_type);
create index if not exists experience_log_entries_deleted_at_idx
  on experience_log_entries (deleted_at);

create table if not exists experience_milestones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  category_id uuid references competency_categories(id) on delete set null,
  competency_id uuid references competencies(id) on delete set null,
  kind "ExperienceMilestoneKind" not null default 'GENERAL',
  name text not null,
  description text,
  target_hours numeric(10, 2) not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index if not exists experience_milestones_company_id_is_active_idx
  on experience_milestones (company_id, is_active);
create index if not exists experience_milestones_category_id_idx
  on experience_milestones (category_id);
create index if not exists experience_milestones_competency_id_idx
  on experience_milestones (competency_id);
create index if not exists experience_milestones_kind_idx
  on experience_milestones (kind);
create index if not exists experience_milestones_deleted_at_idx
  on experience_milestones (deleted_at);

alter table experience_log_entries enable row level security;
alter table experience_milestones enable row level security;
