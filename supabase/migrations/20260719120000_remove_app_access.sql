-- Proven-only access: remove Pull product gate from employees.
-- Safe: drops app_access column + AppAccess enum only.
-- Keeps users, employees, curriculum, progress, assessments, etc.

drop index if exists employees_company_id_app_access_idx;

alter table employees
  drop column if exists app_access;

drop type if exists "AppAccess";
