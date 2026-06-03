-- ============================================================
-- STAGE ZERO — PRODUCTION MIGRATIONS
-- Run this entire file in Supabase SQL Editor (once only).
-- ============================================================

-- ── 1. startups table additions ──────────────────────────────
alter table startups
  add column if not exists status text not null default 'pending_review'
    check (status in ('pending_review','active','paused','rejected','changes_requested')),
  add column if not exists rejection_reason text,
  add column if not exists view_count integer not null default 0,
  add column if not exists is_featured boolean not null default false;

-- ── 2. users table additions ─────────────────────────────────
alter table users
  add column if not exists is_banned boolean not null default false;

-- ── 3. matches — ensure status column exists ─────────────────
-- (column may already exist; this is idempotent)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'matches' and column_name = 'status'
  ) then
    alter table matches add column status text not null default 'pending'
      check (status in ('pending','accepted','declined','expired'));
  end if;
end $$;

-- ── 4. notifications table ────────────────────────────────────
create table if not exists notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null,
  message     text not null,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table notifications enable row level security;

drop policy if exists "Users read own notifications"   on notifications;
drop policy if exists "Users update own notifications" on notifications;
drop policy if exists "Service inserts notifications"  on notifications;

create policy "Users read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- Service-role inserts (from API routes using service key)
create policy "Service inserts notifications"
  on notifications for insert
  with check (true);

-- Index for fast per-user queries
create index if not exists notifications_user_id_idx
  on notifications(user_id, created_at desc);

-- ── 5. saved_startups table (replaces localStorage) ───────────
create table if not exists saved_startups (
  id          uuid primary key default uuid_generate_v4(),
  investor_id uuid not null references investors(id) on delete cascade,
  startup_id  uuid not null references startups(id)  on delete cascade,
  created_at  timestamptz not null default now(),
  unique(investor_id, startup_id)
);

alter table saved_startups enable row level security;

drop policy if exists "Investors manage own saved" on saved_startups;

create policy "Investors manage own saved"
  on saved_startups for all
  using (
    auth.uid() = (select user_id from investors where id = investor_id)
  )
  with check (
    auth.uid() = (select user_id from investors where id = investor_id)
  );

create index if not exists saved_startups_investor_idx
  on saved_startups(investor_id);

-- ── 6. reports table ─────────────────────────────────────────
create table if not exists reports (
  id               uuid primary key default uuid_generate_v4(),
  reporter_id      uuid not null references users(id),
  reported_user_id uuid not null references users(id),
  match_id         uuid references matches(id),
  reason           text not null,
  is_resolved      boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table reports enable row level security;

create policy "Users create reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

-- ── 7. Auto-expire matches older than 14 days (pg_cron) ───────
-- Enable pg_cron extension first in Supabase Dashboard → Database → Extensions
-- Then run:
-- select cron.schedule(
--   'expire-old-matches',
--   '0 3 * * *',
--   $$
--     update matches
--     set status = 'expired'
--     where status = 'pending'
--       and created_at < now() - interval '14 days';
--   $$
-- );

-- ── 8. increment_view_count function (safe, race-condition-free)
create or replace function increment_startup_view(startup_id uuid)
returns void
language sql
security definer
as $$
  update startups set view_count = view_count + 1 where id = startup_id;
$$;

-- ── 9. Service-role helper: insert notification from API route ─
-- (No extra function needed — API routes use service key directly)

-- Done. Verify with:
-- select column_name from information_schema.columns where table_name='startups';
-- select tablename from pg_tables where schemaname='public';
