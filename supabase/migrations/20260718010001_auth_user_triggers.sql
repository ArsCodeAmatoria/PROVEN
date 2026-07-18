-- Proven CMS — Auth sync triggers for users + employees (post complete schema)
-- Apply after 20260718010000_complete_schema.sql

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'READ_ONLY');
  v_company_id uuid := nullif(new.raw_user_meta_data->>'company_id', '')::uuid;
  v_first text := coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1));
  v_last text := coalesce(new.raw_user_meta_data->>'last_name', '');
  v_user_id uuid;
begin
  if v_role not in (
    'SUPER_ADMIN', 'COMPANY_ADMIN', 'INSTRUCTOR', 'SUPERVISOR',
    'APPRENTICE', 'OPERATOR', 'READ_ONLY'
  ) then
    v_role := 'READ_ONLY';
  end if;

  insert into public.users (
    id, auth_user_id, email, first_name, last_name, is_active, created_at, updated_at
  ) values (
    gen_random_uuid(),
    new.id::text,
    new.email,
    v_first,
    v_last,
    true,
    now(),
    now()
  )
  returning id into v_user_id;

  insert into public.user_settings (
    id, user_id, email_notifications, assessment_reminders,
    remember_me_default, timezone, locale, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    true,
    true,
    true,
    'America/New_York',
    'en-US',
    now(),
    now()
  );

  if v_company_id is not null then
    insert into public.employees (
      id, user_id, company_id, role, status, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      v_company_id,
      v_role::"UserRole",
      'ACTIVE',
      now(),
      now()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set email = new.email, updated_at = now()
  where auth_user_id = new.id::text
    and deleted_at is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_updated();
