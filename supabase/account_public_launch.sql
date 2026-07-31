-- Run this in Supabase SQL Editor before enabling public account deletion.
-- It adds public-launch account/safety helpers:
-- 1. unverified emails stay in viewer mode at the database layer
-- 2. signed-in users can delete their own account after the app re-checks their password

create or replace function public.is_email_verified()
returns boolean
language sql
stable
security definer
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and email_confirmed_at is not null
  );
$$;

revoke all on function public.is_email_verified() from public;
grant execute on function public.is_email_verified() to authenticated;

do $$
begin
  if to_regclass('public.posts') is not null then
    execute 'alter table public.posts enable row level security';
    execute 'drop policy if exists "verified users can write space posts" on public.posts';
    execute 'create policy "verified users can write space posts" on public.posts for insert to authenticated with check (auth.uid() = user_id and public.is_email_verified())';
    execute 'drop policy if exists "public launch verified space writers only" on public.posts';
    execute 'create policy "public launch verified space writers only" on public.posts as restrictive for insert to authenticated with check (public.is_email_verified())';
  end if;

  if to_regclass('public.daily_posts') is not null then
    execute 'alter table public.daily_posts enable row level security';
    execute 'drop policy if exists "verified users can create one daily post" on public.daily_posts';
    execute 'create policy "verified users can create one daily post" on public.daily_posts for insert to authenticated with check (auth.uid() = user_id and public.is_email_verified())';
    execute 'drop policy if exists "public launch verified daily writers only" on public.daily_posts';
    execute 'create policy "public launch verified daily writers only" on public.daily_posts as restrictive for insert to authenticated with check (public.is_email_verified())';
  end if;

  if to_regclass('public.daily_post_comments') is not null then
    execute 'alter table public.daily_post_comments enable row level security';
    execute 'drop policy if exists "verified users can comment as themselves" on public.daily_post_comments';
    execute 'create policy "verified users can comment as themselves" on public.daily_post_comments for insert to authenticated with check (auth.uid() = user_id and public.is_email_verified())';
    execute 'drop policy if exists "public launch verified comment writers only" on public.daily_post_comments';
    execute 'create policy "public launch verified comment writers only" on public.daily_post_comments as restrictive for insert to authenticated with check (public.is_email_verified())';
  end if;
end $$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_issued_at timestamptz;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  v_issued_at := to_timestamp((auth.jwt() ->> 'iat')::bigint);

  if v_issued_at < now() - interval '5 minutes' then
    raise exception 'recent password verification required';
  end if;

  if to_regclass('public.daily_post_comments') is not null then
    delete from public.daily_post_comments where user_id = v_user_id;
  end if;

  if to_regclass('public.daily_posts') is not null then
    delete from public.daily_posts where user_id = v_user_id;
  end if;

  if to_regclass('public.posts') is not null then
    delete from public.posts where user_id = v_user_id;
  end if;

  if to_regclass('public.violations') is not null then
    delete from public.violations where user_id = v_user_id;
  end if;

  if to_regclass('public.safety_reports') is not null then
    delete from public.safety_reports
    where reporter_id = v_user_id
       or reported_user_id = v_user_id;
  end if;

  if to_regclass('public.user_safety_status') is not null then
    delete from public.user_safety_status where user_id = v_user_id;
  end if;

  if to_regclass('public.match_requests') is not null then
    delete from public.match_requests where user_id = v_user_id;
  end if;

  if to_regclass('public.user_matches') is not null then
    delete from public.user_matches
    where user_a = v_user_id
       or user_b = v_user_id;
  end if;

  if to_regclass('public.profiles') is not null then
    delete from public.profiles where id = v_user_id;
  end if;

  delete from auth.users where id = v_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
