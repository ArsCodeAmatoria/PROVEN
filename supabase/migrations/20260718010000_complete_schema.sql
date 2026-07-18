-- =============================================================================
-- Proven CMS — Complete application schema
-- Mirrors prisma/schema.prisma: multi-tenant competency management, assessments,
-- exams, training matrices, equipment, media, notifications, and audit logging.
-- UUID primary keys, timestamptz audit columns, soft delete via deleted_at.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enum types (names match Prisma enums)
-- ---------------------------------------------------------------------------
create type "UserRole" as enum (
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'INSTRUCTOR',
  'SUPERVISOR',
  'APPRENTICE',
  'OPERATOR',
  'READ_ONLY'
);

create type "EmployeeStatus" as enum (
  'ACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'TERMINATED'
);

create type "ProjectStatus" as enum (
  'PLANNED',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED'
);

create type "CompetencyStatus" as enum (
  'DRAFT',
  'ACTIVE',
  'ARCHIVED'
);

create type "AssessmentType" as enum (
  'PRACTICAL',
  'WRITTEN',
  'OBSERVATION',
  'PORTFOLIO',
  'ORAL',
  'CONTINUOUS'
);

create type "AssessmentStatus" as enum (
  'DRAFT',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

create type "AssessmentOutcome" as enum (
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPETENT',
  'NOT_YET_COMPETENT',
  'REQUIRES_REVIEW'
);

create type "ObservationRating" as enum (
  'EXCEEDS',
  'MEETS',
  'DEVELOPING',
  'DOES_NOT_MEET'
);

create type "ExamStatus" as enum (
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED'
);

create type "ExamResultStatus" as enum (
  'IN_PROGRESS',
  'SUBMITTED',
  'GRADED',
  'VOIDED'
);

create type "CertificateStatus" as enum (
  'PENDING',
  'ACTIVE',
  'EXPIRED',
  'REVOKED'
);

create type "EquipmentStatus" as enum (
  'AVAILABLE',
  'IN_USE',
  'MAINTENANCE',
  'RETIRED',
  'LOST'
);

create type "MediaEntityType" as enum (
  'COMPANY',
  'EMPLOYEE',
  'PROJECT',
  'COMPETENCY',
  'ASSESSMENT',
  'ASSESSMENT_RESULT',
  'OBSERVATION',
  'EXAM',
  'EXAM_RESULT',
  'CERTIFICATE',
  'EQUIPMENT',
  'TRAINING_MATRIX',
  'OTHER'
);

create type "TrainingRequirementLevel" as enum (
  'REQUIRED',
  'RECOMMENDED',
  'OPTIONAL'
);

create type "TrainingMatrixCellStatus" as enum (
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPETENT',
  'EXPIRED',
  'EXEMPT'
);

create type "NotificationType" as enum (
  'INFO',
  'SUCCESS',
  'WARNING',
  'ALERT',
  'ASSESSMENT',
  'EXAM',
  'CERTIFICATE',
  'SYSTEM'
);

create type "AuditAction" as enum (
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'IMPORT',
  'ASSIGN',
  'COMPLETE'
);

create type "InviteStatus" as enum (
  'PENDING',
  'ACCEPTED',
  'REVOKED',
  'EXPIRED'
);

create type "HourEntryType" as enum (
  'REGULAR',
  'OVERTIME',
  'TRAINING',
  'TRAVEL',
  'OTHER'
);

-- ---------------------------------------------------------------------------
-- updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity & tenancy
-- ---------------------------------------------------------------------------

create table companies (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  slug       text        not null,
  logo_url   text,
  website    text,
  phone      text,
  address    text,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create unique index companies_slug_key on companies (slug);

create index companies_deleted_at_idx on companies (deleted_at);
create index companies_is_active_idx on companies (is_active);
create index companies_created_by_idx on companies (created_by);

create trigger trg_companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table users (
  id            uuid        primary key default gen_random_uuid(),
  auth_user_id  text        not null,
  email         text        not null,
  first_name    text        not null,
  last_name     text        not null,
  avatar_url    text,
  phone         text,
  is_active     boolean     not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  deleted_at    timestamptz
);

create unique index users_auth_user_id_key on users (auth_user_id);

create index users_email_idx on users (email);
create index users_deleted_at_idx on users (deleted_at);
create index users_created_by_idx on users (created_by);

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

-- Deferred created_by FKs (avoid companies ↔ users circularity)
alter table companies
  add constraint companies_created_by_fkey
  foreign key (created_by) references users (id) on delete set null;

alter table users
  add constraint users_created_by_fkey
  foreign key (created_by) references users (id) on delete set null;

-- ---------------------------------------------------------------------------

create table employees (
  id               uuid             primary key default gen_random_uuid(),
  user_id          uuid             not null,
  company_id       uuid             not null,
  role             "UserRole"       not null default 'READ_ONLY',
  status           "EmployeeStatus" not null default 'ACTIVE',
  employee_number  text,
  title            text,
  department       text,
  hire_date        date,
  termination_date date,
  created_at       timestamptz      not null default now(),
  updated_at       timestamptz      not null default now(),
  created_by       uuid,
  deleted_at       timestamptz,

  constraint employees_user_id_fkey
    foreign key (user_id) references users (id) on delete cascade,
  constraint employees_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint employees_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index employees_company_id_user_id_key
  on employees (company_id, user_id);
create unique index employees_company_id_employee_number_key
  on employees (company_id, employee_number);

create index employees_company_id_role_idx on employees (company_id, role);
create index employees_company_id_status_idx on employees (company_id, status);
create index employees_user_id_idx on employees (user_id);
create index employees_deleted_at_idx on employees (deleted_at);
create index employees_created_by_idx on employees (created_by);
create index employees_company_id_active_idx
  on employees (company_id) where deleted_at is null;

create trigger trg_employees_updated_at
  before update on employees
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table user_settings (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null,
  email_notifications  boolean     not null default true,
  assessment_reminders boolean     not null default true,
  remember_me_default  boolean     not null default true,
  timezone             text        not null default 'America/New_York',
  locale               text        not null default 'en-US',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid,
  deleted_at           timestamptz,

  constraint user_settings_user_id_fkey
    foreign key (user_id) references users (id) on delete cascade,
  constraint user_settings_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index user_settings_user_id_key on user_settings (user_id);

create index user_settings_deleted_at_idx on user_settings (deleted_at);

create trigger trg_user_settings_updated_at
  before update on user_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table company_invites (
  id          uuid           primary key default gen_random_uuid(),
  company_id  uuid           not null,
  email       text           not null,
  role        "UserRole"     not null default 'OPERATOR',
  token       uuid           not null default gen_random_uuid(),
  status      "InviteStatus" not null default 'PENDING',
  invited_by  uuid           not null,
  expires_at  timestamptz    not null,
  accepted_at timestamptz,
  created_at  timestamptz    not null default now(),
  updated_at  timestamptz    not null default now(),
  created_by  uuid,
  deleted_at  timestamptz,

  constraint company_invites_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint company_invites_invited_by_fkey
    foreign key (invited_by) references users (id) on delete cascade,
  constraint company_invites_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index company_invites_token_key on company_invites (token);

create index company_invites_company_id_email_idx on company_invites (company_id, email);
create index company_invites_token_idx on company_invites (token);
create index company_invites_status_idx on company_invites (status);
create index company_invites_deleted_at_idx on company_invites (deleted_at);
create index company_invites_company_id_active_idx
  on company_invites (company_id) where deleted_at is null;

create trigger trg_company_invites_updated_at
  before update on company_invites
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table projects (
  id          uuid            primary key default gen_random_uuid(),
  company_id  uuid            not null,
  code        text            not null,
  name        text            not null,
  description text,
  status      "ProjectStatus" not null default 'PLANNED',
  location    text,
  start_date  date,
  end_date    date,
  created_at  timestamptz     not null default now(),
  updated_at  timestamptz     not null default now(),
  created_by  uuid,
  deleted_at  timestamptz,

  constraint projects_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint projects_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index projects_company_id_code_key on projects (company_id, code);

create index projects_company_id_status_idx on projects (company_id, status);
create index projects_deleted_at_idx on projects (deleted_at);
create index projects_created_by_idx on projects (created_by);
create index projects_company_id_active_idx
  on projects (company_id) where deleted_at is null;

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table project_assignments (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null,
  employee_id uuid        not null,
  role_label  text,
  starts_at   date,
  ends_at     date,
  is_primary  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid,
  deleted_at  timestamptz,

  constraint project_assignments_project_id_fkey
    foreign key (project_id) references projects (id) on delete cascade,
  constraint project_assignments_employee_id_fkey
    foreign key (employee_id) references employees (id) on delete cascade,
  constraint project_assignments_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index project_assignments_project_id_employee_id_key
  on project_assignments (project_id, employee_id);

create index project_assignments_employee_id_idx on project_assignments (employee_id);
create index project_assignments_deleted_at_idx on project_assignments (deleted_at);

create trigger trg_project_assignments_updated_at
  before update on project_assignments
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Competencies
-- ---------------------------------------------------------------------------

create table competency_categories (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null,
  parent_id   uuid,
  code        text        not null,
  name        text        not null,
  description text,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid,
  deleted_at  timestamptz,

  constraint competency_categories_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint competency_categories_parent_id_fkey
    foreign key (parent_id) references competency_categories (id) on delete set null,
  constraint competency_categories_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index competency_categories_company_id_code_key
  on competency_categories (company_id, code);

create index competency_categories_company_id_parent_id_idx
  on competency_categories (company_id, parent_id);
create index competency_categories_deleted_at_idx on competency_categories (deleted_at);
create index competency_categories_company_id_active_idx
  on competency_categories (company_id) where deleted_at is null;

create trigger trg_competency_categories_updated_at
  before update on competency_categories
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table competencies (
  id          uuid               primary key default gen_random_uuid(),
  company_id  uuid               not null,
  category_id uuid,
  code        text               not null,
  title       text               not null,
  description text               not null,
  trade       text,
  level       integer            not null default 1,
  status      "CompetencyStatus" not null default 'DRAFT',
  version     integer            not null default 1,
  created_at  timestamptz        not null default now(),
  updated_at  timestamptz        not null default now(),
  created_by  uuid,
  deleted_at  timestamptz,

  constraint competencies_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint competencies_category_id_fkey
    foreign key (category_id) references competency_categories (id) on delete set null,
  constraint competencies_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index competencies_company_id_code_version_key
  on competencies (company_id, code, version);

create index competencies_company_id_status_idx on competencies (company_id, status);
create index competencies_category_id_idx on competencies (category_id);
create index competencies_trade_idx on competencies (trade);
create index competencies_deleted_at_idx on competencies (deleted_at);
create index competencies_company_id_active_idx
  on competencies (company_id) where deleted_at is null;

create trigger trg_competencies_updated_at
  before update on competencies
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table competency_criteria (
  id            uuid        primary key default gen_random_uuid(),
  competency_id uuid        not null,
  description   text        not null,
  sort_order    integer     not null default 0,
  is_critical   boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  deleted_at    timestamptz,

  constraint competency_criteria_competency_id_fkey
    foreign key (competency_id) references competencies (id) on delete cascade,
  constraint competency_criteria_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index competency_criteria_competency_id_idx on competency_criteria (competency_id);
create index competency_criteria_deleted_at_idx on competency_criteria (deleted_at);

create trigger trg_competency_criteria_updated_at
  before update on competency_criteria
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Assessments & results
-- ---------------------------------------------------------------------------

create table assessments (
  id            uuid               primary key default gen_random_uuid(),
  company_id    uuid               not null,
  project_id    uuid,
  competency_id uuid,
  assessor_id   uuid,
  type          "AssessmentType"   not null,
  title         text               not null,
  description   text,
  status        "AssessmentStatus" not null default 'DRAFT',
  scheduled_at  timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz        not null default now(),
  updated_at    timestamptz        not null default now(),
  created_by    uuid,
  deleted_at    timestamptz,

  constraint assessments_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint assessments_project_id_fkey
    foreign key (project_id) references projects (id) on delete set null,
  constraint assessments_competency_id_fkey
    foreign key (competency_id) references competencies (id) on delete set null,
  constraint assessments_assessor_id_fkey
    foreign key (assessor_id) references employees (id) on delete set null,
  constraint assessments_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index assessments_company_id_status_idx on assessments (company_id, status);
create index assessments_project_id_idx on assessments (project_id);
create index assessments_competency_id_idx on assessments (competency_id);
create index assessments_assessor_id_idx on assessments (assessor_id);
create index assessments_deleted_at_idx on assessments (deleted_at);
create index assessments_company_id_active_idx
  on assessments (company_id) where deleted_at is null;

create trigger trg_assessments_updated_at
  before update on assessments
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table assessment_results (
  id             uuid                primary key default gen_random_uuid(),
  assessment_id  uuid                not null,
  employee_id    uuid                not null,
  assessor_id    uuid,
  outcome        "AssessmentOutcome" not null default 'NOT_STARTED',
  score          integer,
  max_score      integer,
  feedback       text,
  evidence_notes text,
  assessed_at    timestamptz,
  valid_until    timestamptz,
  created_at     timestamptz         not null default now(),
  updated_at     timestamptz         not null default now(),
  created_by     uuid,
  deleted_at     timestamptz,

  constraint assessment_results_assessment_id_fkey
    foreign key (assessment_id) references assessments (id) on delete cascade,
  constraint assessment_results_employee_id_fkey
    foreign key (employee_id) references employees (id) on delete cascade,
  constraint assessment_results_assessor_id_fkey
    foreign key (assessor_id) references employees (id) on delete set null,
  constraint assessment_results_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index assessment_results_assessment_id_employee_id_key
  on assessment_results (assessment_id, employee_id);

create index assessment_results_employee_id_outcome_idx
  on assessment_results (employee_id, outcome);
create index assessment_results_assessor_id_idx on assessment_results (assessor_id);
create index assessment_results_deleted_at_idx on assessment_results (deleted_at);

create trigger trg_assessment_results_updated_at
  before update on assessment_results
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Observations
-- ---------------------------------------------------------------------------

create table observations (
  id            uuid                primary key default gen_random_uuid(),
  company_id    uuid                not null,
  project_id    uuid,
  competency_id uuid,
  employee_id   uuid                not null,
  observer_id   uuid                not null,
  context       text                not null,
  rating        "ObservationRating" not null,
  notes         text                not null,
  observed_at   timestamptz         not null default now(),
  created_at    timestamptz         not null default now(),
  updated_at    timestamptz         not null default now(),
  created_by    uuid,
  deleted_at    timestamptz,

  constraint observations_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint observations_project_id_fkey
    foreign key (project_id) references projects (id) on delete set null,
  constraint observations_competency_id_fkey
    foreign key (competency_id) references competencies (id) on delete set null,
  constraint observations_employee_id_fkey
    foreign key (employee_id) references employees (id) on delete cascade,
  constraint observations_observer_id_fkey
    foreign key (observer_id) references employees (id) on delete restrict,
  constraint observations_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index observations_company_id_observed_at_idx
  on observations (company_id, observed_at);
create index observations_employee_id_idx on observations (employee_id);
create index observations_observer_id_idx on observations (observer_id);
create index observations_project_id_idx on observations (project_id);
create index observations_deleted_at_idx on observations (deleted_at);
create index observations_company_id_active_idx
  on observations (company_id) where deleted_at is null;

create trigger trg_observations_updated_at
  before update on observations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Written exams
-- ---------------------------------------------------------------------------

create table written_exams (
  id            uuid         primary key default gen_random_uuid(),
  company_id    uuid         not null,
  code          text         not null,
  title         text         not null,
  description   text,
  status        "ExamStatus" not null default 'DRAFT',
  passing_score integer      not null default 70,
  time_limit_min integer,
  version       integer      not null default 1,
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),
  created_by    uuid,
  deleted_at    timestamptz,

  constraint written_exams_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint written_exams_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index written_exams_company_id_code_version_key
  on written_exams (company_id, code, version);

create index written_exams_company_id_status_idx on written_exams (company_id, status);
create index written_exams_deleted_at_idx on written_exams (deleted_at);
create index written_exams_company_id_active_idx
  on written_exams (company_id) where deleted_at is null;

create trigger trg_written_exams_updated_at
  before update on written_exams
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table exam_competencies (
  id            uuid        primary key default gen_random_uuid(),
  exam_id       uuid        not null,
  competency_id uuid        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  deleted_at    timestamptz,

  constraint exam_competencies_exam_id_fkey
    foreign key (exam_id) references written_exams (id) on delete cascade,
  constraint exam_competencies_competency_id_fkey
    foreign key (competency_id) references competencies (id) on delete cascade,
  constraint exam_competencies_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index exam_competencies_exam_id_competency_id_key
  on exam_competencies (exam_id, competency_id);

create index exam_competencies_competency_id_idx on exam_competencies (competency_id);
create index exam_competencies_deleted_at_idx on exam_competencies (deleted_at);

create trigger trg_exam_competencies_updated_at
  before update on exam_competencies
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table exam_questions (
  id            uuid        primary key default gen_random_uuid(),
  exam_id       uuid        not null,
  prompt        text        not null,
  options       jsonb       not null,
  correct_index integer     not null,
  points        integer     not null default 1,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  deleted_at    timestamptz,

  constraint exam_questions_exam_id_fkey
    foreign key (exam_id) references written_exams (id) on delete cascade,
  constraint exam_questions_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index exam_questions_exam_id_sort_order_idx
  on exam_questions (exam_id, sort_order);
create index exam_questions_deleted_at_idx on exam_questions (deleted_at);

create trigger trg_exam_questions_updated_at
  before update on exam_questions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table exam_results (
  id           uuid               primary key default gen_random_uuid(),
  exam_id      uuid               not null,
  employee_id  uuid               not null,
  status       "ExamResultStatus" not null default 'IN_PROGRESS',
  score        integer,
  max_score    integer,
  passed       boolean,
  answers      jsonb,
  started_at   timestamptz        not null default now(),
  submitted_at timestamptz,
  graded_at    timestamptz,
  created_at   timestamptz        not null default now(),
  updated_at   timestamptz        not null default now(),
  created_by   uuid,
  deleted_at   timestamptz,

  constraint exam_results_exam_id_fkey
    foreign key (exam_id) references written_exams (id) on delete cascade,
  constraint exam_results_employee_id_fkey
    foreign key (employee_id) references employees (id) on delete cascade,
  constraint exam_results_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index exam_results_exam_id_status_idx on exam_results (exam_id, status);
create index exam_results_employee_id_idx on exam_results (employee_id);
create index exam_results_deleted_at_idx on exam_results (deleted_at);

create trigger trg_exam_results_updated_at
  before update on exam_results
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Certificates
-- ---------------------------------------------------------------------------

create table certificates (
  id            uuid                primary key default gen_random_uuid(),
  company_id    uuid                not null,
  employee_id   uuid                not null,
  competency_id uuid,
  name          text                not null,
  issuer        text                not null,
  credential_id text,
  status        "CertificateStatus" not null default 'PENDING',
  issued_at     timestamptz,
  expires_at    timestamptz,
  document_url  text,
  created_at    timestamptz         not null default now(),
  updated_at    timestamptz         not null default now(),
  created_by    uuid,
  deleted_at    timestamptz,

  constraint certificates_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint certificates_employee_id_fkey
    foreign key (employee_id) references employees (id) on delete cascade,
  constraint certificates_competency_id_fkey
    foreign key (competency_id) references competencies (id) on delete set null,
  constraint certificates_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index certificates_company_id_status_idx on certificates (company_id, status);
create index certificates_employee_id_idx on certificates (employee_id);
create index certificates_expires_at_idx on certificates (expires_at);
create index certificates_deleted_at_idx on certificates (deleted_at);
create index certificates_company_id_active_idx
  on certificates (company_id) where deleted_at is null;

create trigger trg_certificates_updated_at
  before update on certificates
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Employee hours
-- ---------------------------------------------------------------------------

create table employee_hours (
  id          uuid            primary key default gen_random_uuid(),
  company_id  uuid            not null,
  employee_id uuid            not null,
  project_id  uuid,
  entry_type  "HourEntryType" not null default 'REGULAR',
  work_date   date            not null,
  hours       numeric(6, 2)   not null,
  description text,
  created_at  timestamptz     not null default now(),
  updated_at  timestamptz     not null default now(),
  created_by  uuid,
  deleted_at  timestamptz,

  constraint employee_hours_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint employee_hours_employee_id_fkey
    foreign key (employee_id) references employees (id) on delete cascade,
  constraint employee_hours_project_id_fkey
    foreign key (project_id) references projects (id) on delete set null,
  constraint employee_hours_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index employee_hours_company_id_work_date_idx
  on employee_hours (company_id, work_date);
create index employee_hours_employee_id_work_date_idx
  on employee_hours (employee_id, work_date);
create index employee_hours_project_id_idx on employee_hours (project_id);
create index employee_hours_deleted_at_idx on employee_hours (deleted_at);
create index employee_hours_company_id_active_idx
  on employee_hours (company_id) where deleted_at is null;

create trigger trg_employee_hours_updated_at
  before update on employee_hours
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Equipment
-- ---------------------------------------------------------------------------

create table equipment_types (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null,
  code        text        not null,
  name        text        not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid,
  deleted_at  timestamptz,

  constraint equipment_types_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint equipment_types_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index equipment_types_company_id_code_key
  on equipment_types (company_id, code);

create index equipment_types_deleted_at_idx on equipment_types (deleted_at);
create index equipment_types_company_id_active_idx
  on equipment_types (company_id) where deleted_at is null;

create trigger trg_equipment_types_updated_at
  before update on equipment_types
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table equipment (
  id                uuid              primary key default gen_random_uuid(),
  company_id        uuid              not null,
  equipment_type_id uuid              not null,
  project_id        uuid,
  assigned_to_id    uuid,
  asset_tag         text              not null,
  name              text              not null,
  serial_number     text,
  status            "EquipmentStatus" not null default 'AVAILABLE',
  purchased_at      date,
  notes             text,
  created_at        timestamptz       not null default now(),
  updated_at        timestamptz       not null default now(),
  created_by        uuid,
  deleted_at        timestamptz,

  constraint equipment_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint equipment_equipment_type_id_fkey
    foreign key (equipment_type_id) references equipment_types (id) on delete restrict,
  constraint equipment_project_id_fkey
    foreign key (project_id) references projects (id) on delete set null,
  constraint equipment_assigned_to_id_fkey
    foreign key (assigned_to_id) references employees (id) on delete set null,
  constraint equipment_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index equipment_company_id_asset_tag_key
  on equipment (company_id, asset_tag);

create index equipment_company_id_status_idx on equipment (company_id, status);
create index equipment_equipment_type_id_idx on equipment (equipment_type_id);
create index equipment_project_id_idx on equipment (project_id);
create index equipment_assigned_to_id_idx on equipment (assigned_to_id);
create index equipment_deleted_at_idx on equipment (deleted_at);
create index equipment_company_id_active_idx
  on equipment (company_id) where deleted_at is null;

create trigger trg_equipment_updated_at
  before update on equipment
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Media
-- ---------------------------------------------------------------------------

create table photos (
  id             uuid              primary key default gen_random_uuid(),
  company_id     uuid              not null,
  uploaded_by_id uuid,
  entity_type    "MediaEntityType" not null,
  entity_id      uuid              not null,
  storage_path   text              not null,
  url            text              not null,
  caption        text,
  mime_type      text,
  size_bytes     integer,
  width          integer,
  height         integer,
  created_at     timestamptz       not null default now(),
  updated_at     timestamptz       not null default now(),
  created_by     uuid,
  deleted_at     timestamptz,

  constraint photos_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint photos_uploaded_by_id_fkey
    foreign key (uploaded_by_id) references employees (id) on delete set null,
  constraint photos_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index photos_company_id_entity_type_entity_id_idx
  on photos (company_id, entity_type, entity_id);
create index photos_uploaded_by_id_idx on photos (uploaded_by_id);
create index photos_deleted_at_idx on photos (deleted_at);
create index photos_company_id_active_idx
  on photos (company_id) where deleted_at is null;

create trigger trg_photos_updated_at
  before update on photos
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table videos (
  id             uuid              primary key default gen_random_uuid(),
  company_id     uuid              not null,
  uploaded_by_id uuid,
  entity_type    "MediaEntityType" not null,
  entity_id      uuid              not null,
  storage_path   text              not null,
  url            text              not null,
  caption        text,
  mime_type      text,
  size_bytes     integer,
  duration_sec   integer,
  created_at     timestamptz       not null default now(),
  updated_at     timestamptz       not null default now(),
  created_by     uuid,
  deleted_at     timestamptz,

  constraint videos_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint videos_uploaded_by_id_fkey
    foreign key (uploaded_by_id) references employees (id) on delete set null,
  constraint videos_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index videos_company_id_entity_type_entity_id_idx
  on videos (company_id, entity_type, entity_id);
create index videos_uploaded_by_id_idx on videos (uploaded_by_id);
create index videos_deleted_at_idx on videos (deleted_at);
create index videos_company_id_active_idx
  on videos (company_id) where deleted_at is null;

create trigger trg_videos_updated_at
  before update on videos
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table documents (
  id             uuid              primary key default gen_random_uuid(),
  company_id     uuid              not null,
  uploaded_by_id uuid,
  entity_type    "MediaEntityType" not null,
  entity_id      uuid              not null,
  storage_path   text              not null,
  url            text              not null,
  title          text              not null,
  description    text,
  mime_type      text,
  size_bytes     integer,
  created_at     timestamptz       not null default now(),
  updated_at     timestamptz       not null default now(),
  created_by     uuid,
  deleted_at     timestamptz,

  constraint documents_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint documents_uploaded_by_id_fkey
    foreign key (uploaded_by_id) references employees (id) on delete set null,
  constraint documents_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index documents_company_id_entity_type_entity_id_idx
  on documents (company_id, entity_type, entity_id);
create index documents_uploaded_by_id_idx on documents (uploaded_by_id);
create index documents_deleted_at_idx on documents (deleted_at);
create index documents_company_id_active_idx
  on documents (company_id) where deleted_at is null;

create trigger trg_documents_updated_at
  before update on documents
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Training matrix
-- ---------------------------------------------------------------------------

create table training_matrices (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null,
  project_id  uuid,
  name        text        not null,
  description text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid,
  deleted_at  timestamptz,

  constraint training_matrices_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint training_matrices_project_id_fkey
    foreign key (project_id) references projects (id) on delete set null,
  constraint training_matrices_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index training_matrices_company_id_is_active_idx
  on training_matrices (company_id, is_active);
create index training_matrices_project_id_idx on training_matrices (project_id);
create index training_matrices_deleted_at_idx on training_matrices (deleted_at);
create index training_matrices_company_id_active_idx
  on training_matrices (company_id) where deleted_at is null;

create trigger trg_training_matrices_updated_at
  before update on training_matrices
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table training_matrix_entries (
  id                uuid                       primary key default gen_random_uuid(),
  matrix_id         uuid                       not null,
  employee_id       uuid                       not null,
  competency_id     uuid                       not null,
  requirement_level "TrainingRequirementLevel" not null default 'REQUIRED',
  status            "TrainingMatrixCellStatus" not null default 'NOT_STARTED',
  due_date          date,
  last_assessed_at  timestamptz,
  notes             text,
  created_at        timestamptz                not null default now(),
  updated_at        timestamptz                not null default now(),
  created_by        uuid,
  deleted_at        timestamptz,

  constraint training_matrix_entries_matrix_id_fkey
    foreign key (matrix_id) references training_matrices (id) on delete cascade,
  constraint training_matrix_entries_employee_id_fkey
    foreign key (employee_id) references employees (id) on delete cascade,
  constraint training_matrix_entries_competency_id_fkey
    foreign key (competency_id) references competencies (id) on delete cascade,
  constraint training_matrix_entries_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create unique index training_matrix_entries_matrix_id_employee_id_competency_id_key
  on training_matrix_entries (matrix_id, employee_id, competency_id);

create index training_matrix_entries_employee_id_status_idx
  on training_matrix_entries (employee_id, status);
create index training_matrix_entries_competency_id_idx
  on training_matrix_entries (competency_id);
create index training_matrix_entries_deleted_at_idx
  on training_matrix_entries (deleted_at);

create trigger trg_training_matrix_entries_updated_at
  before update on training_matrix_entries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Notifications & audit
-- ---------------------------------------------------------------------------

create table notifications (
  id          uuid               primary key default gen_random_uuid(),
  company_id  uuid,
  employee_id uuid               not null,
  type        "NotificationType" not null default 'INFO',
  title       text               not null,
  body        text               not null,
  link_url    text,
  is_read     boolean            not null default false,
  read_at     timestamptz,
  created_at  timestamptz        not null default now(),
  updated_at  timestamptz        not null default now(),
  created_by  uuid,
  deleted_at  timestamptz,

  constraint notifications_company_id_fkey
    foreign key (company_id) references companies (id) on delete cascade,
  constraint notifications_employee_id_fkey
    foreign key (employee_id) references employees (id) on delete cascade,
  constraint notifications_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index notifications_employee_id_is_read_created_at_idx
  on notifications (employee_id, is_read, created_at);
create index notifications_company_id_idx on notifications (company_id);
create index notifications_deleted_at_idx on notifications (deleted_at);
create index notifications_company_id_active_idx
  on notifications (company_id) where deleted_at is null;

create trigger trg_notifications_updated_at
  before update on notifications
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table audit_logs (
  id            uuid          primary key default gen_random_uuid(),
  company_id    uuid,
  actor_user_id uuid,
  action        "AuditAction" not null,
  entity_type   text          not null,
  entity_id     uuid,
  summary       text,
  before_data   jsonb,
  after_data    jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  created_by    uuid,
  deleted_at    timestamptz,

  constraint audit_logs_company_id_fkey
    foreign key (company_id) references companies (id) on delete set null,
  constraint audit_logs_created_by_fkey
    foreign key (created_by) references users (id) on delete set null
);

create index audit_logs_company_id_created_at_idx
  on audit_logs (company_id, created_at);
create index audit_logs_actor_user_id_created_at_idx
  on audit_logs (actor_user_id, created_at);
create index audit_logs_entity_type_entity_id_idx
  on audit_logs (entity_type, entity_id);
create index audit_logs_action_idx on audit_logs (action);
create index audit_logs_deleted_at_idx on audit_logs (deleted_at);
create index audit_logs_company_id_active_idx
  on audit_logs (company_id) where deleted_at is null;

create trigger trg_audit_logs_updated_at
  before update on audit_logs
  for each row execute function set_updated_at();
