create extension if not exists citext;

create table if not exists users (
    uid pg_catalog.uuid primary key default pg_catalog.gen_random_uuid(),
    username varchar(16) not null,
    email citext not null,
    joined pg_catalog.timestamptz not null default now()
);

create unique index if not exists users_idx on users (uid);

create table if not exists users_preferences (
    owner pg_catalog.uuid not null references users (uid) on delete cascade,
    display_name varchar(32) not null default '',
    description varchar(256) not null default '',
    avatar_hash text not null,
    session_live int not null default 7,
    unique (owner)
);

create unique index if not exists users_preferences_owner_idx on users_preferences (owner);

create table if not exists users_security (
    owner pg_catalog.uuid not null references users (uid) on delete cascade,
    email_verified boolean not null default false,
    totp_enabled boolean not null default false,
    totp_secret text,
    totp_confirmed pg_catalog.timestamptz,
    totp_pending text,
    totp_pending_created pg_catalog.timestamptz,
    totp_last_step bigint,
    unique (owner)
);

create unique index if not exists users_security_owner_idx on users_security (owner);

create table if not exists users_security_codes (
    owner pg_catalog.uuid not null references users (uid) on delete cascade,
    hash text not null,
    used pg_catalog.timestamptz,
    created pg_catalog.timestamptz not null default now(),
    unique (owner, hash)
);

create index if not exists users_security_codes_owner_idx on users_security_codes (owner);

create type oauth_service as enum ('vk');

create table if not exists users_oauth (
    owner pg_catalog.uuid not null references users (uid) on delete cascade,
    service oauth_service not null,
    id text not null,
    at pg_catalog.timestamptz not null default now(),
    unique (owner, service)
);

create index if not exists users_oauth_owner_idx on users_oauth (owner);

create type device_t as enum ('desktop', 'mobile');

create table if not exists sessions (
    id pg_catalog.uuid primary key default pg_catalog.gen_random_uuid(),
    owner pg_catalog.uuid not null references users (uid),
    at pg_catalog.timestamptz not null default now(),
    seen_at pg_catalog.timestamptz not null default now(),
    expires pg_catalog.timestamptz not null,
    mfa boolean not null default false,
    device device_t not null,
    hash text not null
);

create index if not exists sessions_owner_idx on sessions (owner);

create table if not exists ranks (
    id pg_catalog.uuid not null default pg_catalog.gen_random_uuid(),
    name text not null,
    description text not null default '',
    color int not null default 0,
    weight int not null default 0,
    permissions jsonb not null,
    added_at pg_catalog.timestamptz not null default now()
);

create unique index if not exists ranks_idx on ranks (id);
create unique index if not exists ranks_name_uq on ranks (name);

create table if not exists users_ranks (
    owner pg_catalog.uuid not null references users (uid) on delete cascade,
    rank pg_catalog.uuid not null references ranks (id) on delete cascade,
    at pg_catalog.timestamptz not null default now(),
    expires pg_catalog.timestamptz not null
);

create unique index if not exists users_ranks_owner_idx on users_ranks (owner);

create table if not exists banned_emails (
    address citext not null unique,
    reason text not null,
    at pg_catalog.timestamptz not null default now()
);

create index if not exists banned_emails_uq on banned_emails (address);

create table if not exists users_bans (
    id pg_catalog.uuid primary key default pg_catalog.gen_random_uuid(),
    executor pg_catalog.uuid not null references users (uid),
    target pg_catalog.uuid not null references users (uid) on delete cascade,
    reason text not null,
    at pg_catalog.timestamptz not null default now(),
    expires pg_catalog.timestamptz,
    unique (target),
    check (expires is null or expires > at),
    check (executor <> target)
);

create index if not exists users_bans_idx on users_bans (id);
create index if not exists users_bans_executor_idx on users_bans (executor);
create index if not exists users_bans_target_idx on users_bans (target);

create type projects_category as enum ('благоустройство', 'дороги и тротуары', 'освещение', 'детские площадки', 'парки и скверы', 'другое');
create type projects_status as enum ('');

create table if not exists projects (
    id pg_catalog.uuid primary key default pg_catalog.gen_random_uuid(),
    author pg_catalog.uuid not null references users (uid),
    title varchar(64) not null,
    description text not null,
    category projects_category not null default 'другое',
    status projects_status not null default 'ожидает верификации',
    likes int not null default 0,
    at pg_catalog.timestamptz not null default now()
);

create unique index if not exists projects_idx on projects (id);
create index if not exists projects_author_idx on projects (author);

create table if not exists submissions (
    id pg_catalog.uuid primary key default pg_catalog.gen_random_uuid(),
    project pg_catalog.uuid not null references projects (id) on delete cascade,
    approved boolean not null default false,
    reason text,
    update_at pg_catalog.timestamptz,
    unique (project)
);

create unique index if not exists submissions_idx on submissions (id);
create unique index if not exists submissions_project_idx on submissions (project);