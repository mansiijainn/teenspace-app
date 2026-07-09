-- Run this in the Supabase SQL editor before turning on the posts tab in beta.

create table if not exists public.daily_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  content text not null check (char_length(content) <= 420),
  prompt text not null,
  post_day date not null,
  created_at timestamptz not null default now(),
  unique (user_id, post_day)
);

create table if not exists public.daily_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.daily_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  content text not null check (char_length(content) <= 180),
  created_at timestamptz not null default now()
);

alter table public.daily_posts enable row level security;
alter table public.daily_post_comments enable row level security;

drop policy if exists "daily posts are readable by signed in users" on public.daily_posts;
create policy "daily posts are readable by signed in users"
on public.daily_posts for select
to authenticated
using (true);

drop policy if exists "users can create one daily post" on public.daily_posts;
create policy "users can create one daily post"
on public.daily_posts for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can delete their own daily posts" on public.daily_posts;
create policy "users can delete their own daily posts"
on public.daily_posts for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "daily post comments are readable by signed in users" on public.daily_post_comments;
create policy "daily post comments are readable by signed in users"
on public.daily_post_comments for select
to authenticated
using (true);

drop policy if exists "users can comment as themselves" on public.daily_post_comments;
create policy "users can comment as themselves"
on public.daily_post_comments for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can delete their own comments" on public.daily_post_comments;
create policy "users can delete their own comments"
on public.daily_post_comments for delete
to authenticated
using (auth.uid() = user_id);
