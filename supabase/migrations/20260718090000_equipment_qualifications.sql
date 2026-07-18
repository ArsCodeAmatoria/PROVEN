-- Equipment qualifications with supporting assessment links

do $$ begin
  create type "EquipmentQualificationStatus" as enum (
    'ACTIVE',
    'EXPIRED',
    'SUSPENDED',
    'REVOKED'
  );
exception when duplicate_object then null;
end $$;

create table if not exists equipment_qualifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  equipment_type_id uuid not null references equipment_types(id) on delete restrict,
  equipment_id uuid references equipment(id) on delete set null,
  assessor_id uuid references employees(id) on delete set null,
  make text not null,
  model text not null,
  capacity text,
  qualified_at date not null,
  expires_at date,
  status "EquipmentQualificationStatus" not null default 'ACTIVE',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index if not exists equipment_qualifications_company_id_status_idx
  on equipment_qualifications (company_id, status);
create index if not exists equipment_qualifications_employee_id_status_idx
  on equipment_qualifications (employee_id, status);
create index if not exists equipment_qualifications_equipment_type_id_idx
  on equipment_qualifications (equipment_type_id);
create index if not exists equipment_qualifications_equipment_id_idx
  on equipment_qualifications (equipment_id);
create index if not exists equipment_qualifications_assessor_id_idx
  on equipment_qualifications (assessor_id);
create index if not exists equipment_qualifications_expires_at_idx
  on equipment_qualifications (expires_at);
create index if not exists equipment_qualifications_deleted_at_idx
  on equipment_qualifications (deleted_at);

create table if not exists equipment_qualification_assessments (
  id uuid primary key default gen_random_uuid(),
  qualification_id uuid not null references equipment_qualifications(id) on delete cascade,
  assessment_id uuid not null references assessments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (qualification_id, assessment_id)
);

create index if not exists equipment_qualification_assessments_assessment_id_idx
  on equipment_qualification_assessments (assessment_id);
create index if not exists equipment_qualification_assessments_deleted_at_idx
  on equipment_qualification_assessments (deleted_at);

alter table equipment_qualifications enable row level security;
alter table equipment_qualification_assessments enable row level security;
