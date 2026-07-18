-- Proven CMS — Auth helpers, profile sync, storage, and Row Level Security
-- Apply in the Supabase SQL editor after `prisma db push` / migrate,
-- or via `supabase db push` when using the Supabase CLI.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so policies stay simple)
-- ---------------------------------------------------------------------------
create or replace function public.current_auth_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.uid()::text, '');
$$;

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where "authUserId" = auth.uid()::text
  limit 1;
$$;

create or replace function public.current_profile_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.current_profile();
$$;

create or replace function public.current_company_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select "companyId" from public.current_profile();
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.current_profile();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role::text = 'SUPER_ADMIN' from public.current_profile()), false);
$$;

create or replace function public.is_company_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role::text in ('SUPER_ADMIN', 'COMPANY_ADMIN') from public.current_profile()),
    false
  );
$$;

create or replace function public.can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role::text <> 'READ_ONLY' and "isActive" = true from public.current_profile()),
    false
  );
$$;

create or replace function public.same_company(target_company_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or (
      target_company_id is not null
      and target_company_id = public.current_company_id()
    );
$$;

-- ---------------------------------------------------------------------------
-- Auth → Profile sync (creates profile row when a user signs up)
-- Metadata expected on auth.users.raw_user_meta_data:
--   first_name, last_name, role, company_id (optional)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'READ_ONLY');
  v_company_id text := new.raw_user_meta_data->>'company_id';
  v_first text := coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1));
  v_last text := coalesce(new.raw_user_meta_data->>'last_name', '');
  v_profile_id text;
begin
  if v_role not in (
    'SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'SUPERVISOR',
    'APPRENTICE', 'OPERATOR', 'READ_ONLY'
  ) then
    v_role := 'READ_ONLY';
  end if;

  insert into public.profiles (
    id, "authUserId", "companyId", email, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt"
  ) values (
    gen_random_uuid()::text,
    new.id::text,
    nullif(v_company_id, ''),
    new.email,
    v_first,
    v_last,
    v_role::"UserRole",
    true,
    now(),
    now()
  )
  returning id into v_profile_id;

  insert into public.user_settings (
    id, "profileId", "emailNotifications", "assessmentReminders",
    "rememberMeDefault", timezone, locale, "createdAt", "updatedAt"
  ) values (
    gen_random_uuid()::text,
    v_profile_id,
    true,
    true,
    true,
    'America/New_York',
    'en-US',
    now(),
    now()
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep email in sync when auth email changes
create or replace function public.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email, "updatedAt" = now()
  where "authUserId" = new.id::text;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_updated();

-- ---------------------------------------------------------------------------
-- Storage bucket for avatars
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.company_invites enable row level security;
alter table public.competencies enable row level security;
alter table public.competency_criteria enable row level security;
alter table public.competency_assessments enable row level security;
alter table public.written_exams enable row level security;
alter table public.exam_competencies enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.apprenticeships enable row level security;
alter table public.apprenticeship_progress enable row level security;
alter table public.instructor_observations enable row level security;
alter table public.certifications enable row level security;
alter table public.continuous_assessments enable row level security;

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------
drop policy if exists "companies_select" on public.companies;
create policy "companies_select" on public.companies
  for select to authenticated
  using (public.is_super_admin() or id = public.current_company_id());

drop policy if exists "companies_insert" on public.companies;
create policy "companies_insert" on public.companies
  for insert to authenticated
  with check (public.is_super_admin() or public.is_company_admin());

drop policy if exists "companies_update" on public.companies;
create policy "companies_update" on public.companies
  for update to authenticated
  using (public.is_super_admin() or (public.is_company_admin() and id = public.current_company_id()))
  with check (public.is_super_admin() or (public.is_company_admin() and id = public.current_company_id()));

drop policy if exists "companies_delete" on public.companies;
create policy "companies_delete" on public.companies
  for delete to authenticated
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    public.is_super_admin()
    or "authUserId" = auth.uid()::text
    or ("companyId" is not null and "companyId" = public.current_company_id())
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using ("authUserId" = auth.uid()::text)
  with check ("authUserId" = auth.uid()::text);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (
    public.is_super_admin()
    or (public.is_company_admin() and "companyId" = public.current_company_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_company_admin() and "companyId" = public.current_company_id())
  );

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (public.is_company_admin() and "companyId" = public.current_company_id())
    or "authUserId" = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- User settings
-- ---------------------------------------------------------------------------
drop policy if exists "user_settings_select" on public.user_settings;
create policy "user_settings_select" on public.user_settings
  for select to authenticated
  using ("profileId" = public.current_profile_id() or public.is_super_admin());

drop policy if exists "user_settings_update" on public.user_settings;
create policy "user_settings_update" on public.user_settings
  for update to authenticated
  using ("profileId" = public.current_profile_id())
  with check ("profileId" = public.current_profile_id());

drop policy if exists "user_settings_insert" on public.user_settings;
create policy "user_settings_insert" on public.user_settings
  for insert to authenticated
  with check ("profileId" = public.current_profile_id() or public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Company invites
-- ---------------------------------------------------------------------------
drop policy if exists "invites_select" on public.company_invites;
create policy "invites_select" on public.company_invites
  for select to authenticated
  using (
    public.is_super_admin()
    or "companyId" = public.current_company_id()
    or lower(email) = lower(coalesce((select email from public.current_profile()), ''))
  );

drop policy if exists "invites_write" on public.company_invites;
create policy "invites_write" on public.company_invites
  for all to authenticated
  using (public.is_company_admin() and public.same_company("companyId"))
  with check (public.is_company_admin() and public.same_company("companyId"));

-- ---------------------------------------------------------------------------
-- Company-scoped domain tables (shared pattern)
-- ---------------------------------------------------------------------------
drop policy if exists "competencies_select" on public.competencies;
create policy "competencies_select" on public.competencies
  for select to authenticated
  using (public.same_company("companyId"));

drop policy if exists "competencies_write" on public.competencies;
create policy "competencies_write" on public.competencies
  for all to authenticated
  using (public.can_write() and public.same_company("companyId") and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'OPERATOR'))
  with check (public.can_write() and public.same_company("companyId") and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'OPERATOR'));

drop policy if exists "criteria_select" on public.competency_criteria;
create policy "criteria_select" on public.competency_criteria
  for select to authenticated
  using (
    exists (
      select 1 from public.competencies c
      where c.id = "competencyId" and public.same_company(c."companyId")
    )
  );

drop policy if exists "criteria_write" on public.competency_criteria;
create policy "criteria_write" on public.competency_criteria
  for all to authenticated
  using (
    public.can_write()
    and exists (
      select 1 from public.competencies c
      where c.id = "competencyId" and public.same_company(c."companyId")
    )
  )
  with check (
    public.can_write()
    and exists (
      select 1 from public.competencies c
      where c.id = "competencyId" and public.same_company(c."companyId")
    )
  );

drop policy if exists "comp_assessments_select" on public.competency_assessments;
create policy "comp_assessments_select" on public.competency_assessments
  for select to authenticated
  using (
    public.is_super_admin()
    or "assesseeId" = public.current_profile_id()
    or "assessorId" = public.current_profile_id()
    or exists (
      select 1 from public.competencies c
      where c.id = "competencyId" and public.same_company(c."companyId")
    )
  );

drop policy if exists "comp_assessments_write" on public.competency_assessments;
create policy "comp_assessments_write" on public.competency_assessments
  for all to authenticated
  using (
    public.can_write()
    and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'SUPERVISOR', 'OPERATOR')
  )
  with check (
    public.can_write()
    and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'SUPERVISOR', 'OPERATOR')
  );

drop policy if exists "exams_select" on public.written_exams;
create policy "exams_select" on public.written_exams
  for select to authenticated
  using (public.same_company("companyId"));

drop policy if exists "exams_write" on public.written_exams;
create policy "exams_write" on public.written_exams
  for all to authenticated
  using (public.can_write() and public.same_company("companyId") and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR'))
  with check (public.can_write() and public.same_company("companyId") and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR'));

drop policy if exists "exam_questions_select" on public.exam_questions;
create policy "exam_questions_select" on public.exam_questions
  for select to authenticated
  using (
    exists (
      select 1 from public.written_exams e
      where e.id = "examId" and public.same_company(e."companyId")
    )
  );

drop policy if exists "exam_questions_write" on public.exam_questions;
create policy "exam_questions_write" on public.exam_questions
  for all to authenticated
  using (
    public.can_write()
    and exists (
      select 1 from public.written_exams e
      where e.id = "examId" and public.same_company(e."companyId")
    )
  )
  with check (
    public.can_write()
    and exists (
      select 1 from public.written_exams e
      where e.id = "examId" and public.same_company(e."companyId")
    )
  );

drop policy if exists "exam_competencies_all" on public.exam_competencies;
create policy "exam_competencies_all" on public.exam_competencies
  for all to authenticated
  using (
    exists (
      select 1 from public.written_exams e
      where e.id = "examId" and public.same_company(e."companyId")
    )
  )
  with check (
    exists (
      select 1 from public.written_exams e
      where e.id = "examId" and public.same_company(e."companyId")
    )
  );

drop policy if exists "exam_attempts_select" on public.exam_attempts;
create policy "exam_attempts_select" on public.exam_attempts
  for select to authenticated
  using (
    "profileId" = public.current_profile_id()
    or public.is_company_admin()
    or public.current_user_role() in ('INSTRUCTOR', 'SUPERVISOR')
  );

drop policy if exists "exam_attempts_write" on public.exam_attempts;
create policy "exam_attempts_write" on public.exam_attempts
  for all to authenticated
  using (
    public.can_write()
    and (
      "profileId" = public.current_profile_id()
      or public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR')
    )
  )
  with check (
    public.can_write()
    and (
      "profileId" = public.current_profile_id()
      or public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR')
    )
  );

drop policy if exists "apprenticeships_select" on public.apprenticeships;
create policy "apprenticeships_select" on public.apprenticeships
  for select to authenticated
  using (
    public.same_company("companyId")
    and (
      public.current_user_role() <> 'APPRENTICE'
      or "apprenticeId" = public.current_profile_id()
    )
  );

drop policy if exists "apprenticeships_write" on public.apprenticeships;
create policy "apprenticeships_write" on public.apprenticeships
  for all to authenticated
  using (
    public.can_write()
    and public.same_company("companyId")
    and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'SUPERVISOR')
  )
  with check (
    public.can_write()
    and public.same_company("companyId")
    and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'SUPERVISOR')
  );

drop policy if exists "apprenticeship_progress_select" on public.apprenticeship_progress;
create policy "apprenticeship_progress_select" on public.apprenticeship_progress
  for select to authenticated
  using (
    exists (
      select 1 from public.apprenticeships a
      where a.id = "apprenticeshipId"
        and public.same_company(a."companyId")
        and (
          public.current_user_role() <> 'APPRENTICE'
          or a."apprenticeId" = public.current_profile_id()
        )
    )
  );

drop policy if exists "apprenticeship_progress_write" on public.apprenticeship_progress;
create policy "apprenticeship_progress_write" on public.apprenticeship_progress
  for all to authenticated
  using (
    public.can_write()
    and exists (
      select 1 from public.apprenticeships a
      where a.id = "apprenticeshipId" and public.same_company(a."companyId")
    )
  )
  with check (
    public.can_write()
    and exists (
      select 1 from public.apprenticeships a
      where a.id = "apprenticeshipId" and public.same_company(a."companyId")
    )
  );

drop policy if exists "observations_select" on public.instructor_observations;
create policy "observations_select" on public.instructor_observations
  for select to authenticated
  using (
    public.is_super_admin()
    or "observedId" = public.current_profile_id()
    or "observerId" = public.current_profile_id()
    or exists (
      select 1 from public.profiles p
      where p.id = "observedId" and public.same_company(p."companyId")
    )
  );

drop policy if exists "observations_write" on public.instructor_observations;
create policy "observations_write" on public.instructor_observations
  for all to authenticated
  using (
    public.can_write()
    and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'SUPERVISOR')
  )
  with check (
    public.can_write()
    and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'SUPERVISOR')
  );

drop policy if exists "certifications_select" on public.certifications;
create policy "certifications_select" on public.certifications
  for select to authenticated
  using (
    public.same_company("companyId")
    and (
      public.current_user_role() <> 'APPRENTICE'
      or "profileId" = public.current_profile_id()
    )
  );

drop policy if exists "certifications_write" on public.certifications;
create policy "certifications_write" on public.certifications
  for all to authenticated
  using (
    public.can_write()
    and public.same_company("companyId")
    and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'OPERATOR')
  )
  with check (
    public.can_write()
    and public.same_company("companyId")
    and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'OPERATOR')
  );

drop policy if exists "continuous_assessments_select" on public.continuous_assessments;
create policy "continuous_assessments_select" on public.continuous_assessments
  for select to authenticated
  using (
    public.same_company("companyId")
    and (
      public.current_user_role() <> 'APPRENTICE'
      or "assesseeId" = public.current_profile_id()
    )
  );

drop policy if exists "continuous_assessments_write" on public.continuous_assessments;
create policy "continuous_assessments_write" on public.continuous_assessments
  for all to authenticated
  using (
    public.can_write()
    and public.same_company("companyId")
    and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'SUPERVISOR', 'OPERATOR')
  )
  with check (
    public.can_write()
    and public.same_company("companyId")
    and public.current_user_role() in ('SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'SUPERVISOR', 'OPERATOR')
  );
