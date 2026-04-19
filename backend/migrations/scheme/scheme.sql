create extension if not exists citext;

create table if not exists users
(
    uid      uuid primary key     default gen_random_uuid(),
    username varchar(16)            not null,
    email    citext                 not null,
    joined   timestamptz not null default now()
);

create unique index if not exists users_idx on users (uid);

create table if not exists users_preferences
(
    owner        uuid not null references users (uid) on delete cascade,
    display_name varchar(32)     not null default '',
    description  varchar(256)    not null default '',
    avatar_hash  text,
    session_live int             not null default 7,
    unique (owner)
);

create unique index if not exists users_preferences_owner_idx on users_preferences (owner);

create table if not exists users_security
(
    owner                uuid not null references users (uid) on delete cascade,
    password             text            not null,
    email_verified       boolean         not null default false,
    totp_enabled         boolean         not null default false,
    totp_secret          text,
    totp_confirmed       timestamptz,
    totp_pending         text,
    totp_pending_created timestamptz,
    totp_last_step       bigint,
    unique (owner)
);

create unique index if not exists users_security_owner_idx on users_security (owner);

create table if not exists users_security_codes
(
    owner   uuid        not null references users (uid) on delete cascade,
    hash    text                   not null,
    used    timestamptz,
    created timestamptz not null default now(),
    unique (owner, hash)
);

create index if not exists users_security_codes_owner_idx on users_security_codes (owner);

create type oauth_service as enum ('vk', 'tg');

create table if not exists users_oauth
(
    owner   uuid        not null references users (uid) on delete cascade,
    service oauth_service          not null,
    id      text                   not null,
    at      timestamptz not null default now(),
    unique (owner, service)
);

create index if not exists users_oauth_owner_idx on users_oauth (owner);

create type device_t as enum ('desktop', 'mobile', 'tablet');

create table if not exists sessions
(
    id      uuid primary key     default gen_random_uuid(),
    owner   uuid        not null references users (uid),
    at      timestamptz not null default now(),
    seen_at timestamptz not null default now(),
    expires timestamptz not null,
    mfa     boolean                not null default false,
    device  device_t               not null,
    hash    text                   not null
);

create index if not exists sessions_owner_idx on sessions (owner);

create table if not exists ranks
(
    id          uuid        not null default gen_random_uuid(),
    name        text                   not null,
    description text                   not null default '',
    color       bigint                 not null default 0,
    weight      int                    not null default 0,
    permissions jsonb                  not null,
    added_at    timestamptz not null default now()
);

create unique index if not exists ranks_idx on ranks (id);
create unique index if not exists ranks_name_uq on ranks (name);

create table if not exists users_ranks
(
    owner   uuid        not null references users (uid) on delete cascade,
    rank    uuid        not null references ranks (id) on delete cascade,
    at      timestamptz not null default now(),
    expires timestamptz
);

create unique index if not exists users_ranks_owner_idx on users_ranks (owner);

create table if not exists banned_emails
(
    address citext                 not null unique,
    reason  text                   not null,
    at      timestamptz not null default now()
);

create index if not exists banned_emails_uq on banned_emails (address);

create table if not exists users_bans
(
    id       uuid primary key     default gen_random_uuid(),
    executor uuid        not null references users (uid),
    target   uuid        not null references users (uid) on delete cascade,
    reason   text                   not null,
    at       timestamptz not null default now(),
    expires  timestamptz,
    unique (target),
    check (expires is null or expires > at),
    check (executor <> target)
);

create index if not exists users_bans_idx on users_bans (id);
create index if not exists users_bans_executor_idx on users_bans (executor);
create index if not exists users_bans_target_idx on users_bans (target);

create type projects_status as enum ('cancelled', 'listing', 'reviewing', 'implementing', 'implemented');

create table if not exists projects
(
    id          uuid primary key     default gen_random_uuid(),
    author      uuid        not null references users (uid),
    title       varchar(64)            not null,
    description text                   not null,
    category    varchar(64)            not null default 'other',
    status      projects_status        not null default 'reviewing',
    impl_link   text,
    likes       int                    not null default 0,
    at          timestamptz not null default now()
);

create unique index if not exists projects_idx on projects (id);
create index if not exists projects_author_idx on projects (author);

create table if not exists project_messages
(
    id      uuid primary key     default gen_random_uuid(),
    project uuid        not null references projects (id) on delete cascade,
    author  uuid        not null references users (uid),
    parent  uuid references project_messages (id),
    content text                   not null,
    at      timestamptz not null default now(),
    deleted timestamptz
);

create table if not exists submissions
(
    id       uuid primary key default gen_random_uuid(),
    project  uuid not null references projects (id) on delete cascade,
    approved boolean         not null    default false,
    reason   text,
    unique (project)
);

create unique index if not exists submissions_idx on submissions (id);
create unique index if not exists submissions_project_idx on submissions (project);

create type maintenances_status as enum ('expected', 'running', 'completed');
create type maintenances_type as enum ('emergency', 'planned');

create table if not exists maintenances
(
    id            uuid primary key     default gen_random_uuid(),
    description   text                   not null,
    status        maintenances_status    not null default 'expected',
    type          maintenances_type      not null default 'planned',
    planned_start timestamptz not null default now(),
    planned_end   timestamptz,
    actual_start  timestamptz,
    actual_end    timestamptz,
    caller        uuid        not null references users (uid),
    created       timestamptz not null default now(),

    check (planned_end is null or planned_end > planned_start),
    check (actual_end is null or actual_end >= actual_start)
);

create unique index maintenances_idx on maintenances (id);
create index maintenances_caller_idx on maintenances (caller);

create type tickets_status as enum ('closed', 'waiting', 'in work');
create type tickets_caller as enum ('user', 'staff', 'system');

create table if not exists tickets
(
    id       uuid primary key     default gen_random_uuid(),
    author   uuid        not null references users (uid) on delete cascade,
    acceptor uuid,
    status   tickets_status         not null default 'waiting',
    topic    varchar(32)            not null default 'other',
    title    varchar(128)           not null,
    created  timestamptz not null default now(),
    accepted timestamptz,
    closed   timestamptz,
    closer   tickets_caller,
    reason   text,
    check (author <> acceptor),
    check (closer is null or closer = 'user' or reason is not null)
);

create unique index tickets_idx on tickets (id);
create index tickets_author on tickets (author);
create index tickets_acceptor on tickets (acceptor);

create table if not exists tickets_messages
(
    id      uuid primary key     default gen_random_uuid(),
    ticket  uuid        not null references tickets (id) on delete cascade,
    author  uuid        not null references users (uid),
    content text                   not null,
    created timestamptz not null default now()
);

create unique index tickets_messages_idx on tickets_messages (id);
create index tickets_ticket_idx on tickets_messages (ticket);
create index tickets_author_idx on tickets_messages (author);
