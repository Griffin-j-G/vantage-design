-- Vantage — Neon schema for user accounts and profiles.
-- Run against your Neon database, then enable the Data API on the branch
-- so neon.js can reach these tables over REST.

-- Profiles are passwordless: the deployed site sits behind Netlify password
-- protection (the real lock), accounts only keep each user's data separate.
create table if not exists accounts (
  username    text primary key,
  name        text not null,
  account_no  text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists profiles (
  account_no  text primary key references accounts (account_no) on delete cascade,
  settings    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists forum_threads (
  id          bigint generated always as identity primary key,
  account_no  text references accounts (account_no) on delete set null,
  author      text,
  title       text not null,
  body        text,
  votes       integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists forum_replies (
  id          bigint generated always as identity primary key,
  thread_id   bigint not null references forum_threads (id) on delete cascade,
  account_no  text references accounts (account_no) on delete set null,
  author      text,
  body        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists feedback (
  id          bigint generated always as identity primary key,
  account_no  text references accounts (account_no) on delete set null,
  category    text,
  message     text not null,
  created_at  timestamptz not null default now()
);
