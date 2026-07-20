-- Learning platform: roles, curriculum, progress, exam extras

do $$ begin
  alter type "UserRole" add value if not exists 'ASSESSOR';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type "UserRole" add value if not exists 'STUDENT';
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "LessonProgressStatus" as enum ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
exception when duplicate_object then null;
end $$;

alter table exam_results
  add column if not exists duration_seconds integer,
  add column if not exists instructor_employee_id uuid references employees(id) on delete set null;

create index if not exists exam_results_instructor_employee_id_idx
  on exam_results (instructor_employee_id);

-- Allow platform template exams (null company)
alter table written_exams
  alter column company_id drop not null;

create table if not exists curricula (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create unique index if not exists curricula_company_id_code_key
  on curricula (company_id, code);

create index if not exists curricula_is_active_idx on curricula (is_active);
create index if not exists curricula_deleted_at_idx on curricula (deleted_at);

create table if not exists curriculum_modules (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references curricula(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (curriculum_id, code)
);

create index if not exists curriculum_modules_curriculum_id_sort_order_idx
  on curriculum_modules (curriculum_id, sort_order);
create index if not exists curriculum_modules_deleted_at_idx
  on curriculum_modules (deleted_at);

create table if not exists curriculum_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references curriculum_modules(id) on delete cascade,
  content_key text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  estimated_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (module_id, content_key)
);

create index if not exists curriculum_lessons_module_id_sort_order_idx
  on curriculum_lessons (module_id, sort_order);
create index if not exists curriculum_lessons_content_key_idx
  on curriculum_lessons (content_key);
create index if not exists curriculum_lessons_deleted_at_idx
  on curriculum_lessons (deleted_at);

create table if not exists curriculum_lesson_competencies (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references curriculum_lessons(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (lesson_id, competency_id)
);

create index if not exists curriculum_lesson_competencies_competency_id_idx
  on curriculum_lesson_competencies (competency_id);
create index if not exists curriculum_lesson_competencies_deleted_at_idx
  on curriculum_lesson_competencies (deleted_at);

create table if not exists curriculum_module_exams (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references curriculum_modules(id) on delete cascade,
  exam_id uuid not null references written_exams(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (module_id, exam_id)
);

create index if not exists curriculum_module_exams_exam_id_idx
  on curriculum_module_exams (exam_id);
create index if not exists curriculum_module_exams_deleted_at_idx
  on curriculum_module_exams (deleted_at);

create table if not exists curriculum_enrolments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  curriculum_id uuid not null references curricula(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (curriculum_id, employee_id)
);

create index if not exists curriculum_enrolments_company_id_employee_id_idx
  on curriculum_enrolments (company_id, employee_id);
create index if not exists curriculum_enrolments_deleted_at_idx
  on curriculum_enrolments (deleted_at);

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null references curriculum_enrolments(id) on delete cascade,
  lesson_id uuid not null references curriculum_lessons(id) on delete cascade,
  status "LessonProgressStatus" not null default 'NOT_STARTED',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (enrolment_id, lesson_id)
);

create index if not exists lesson_progress_lesson_id_status_idx
  on lesson_progress (lesson_id, status);
create index if not exists lesson_progress_deleted_at_idx
  on lesson_progress (deleted_at);
