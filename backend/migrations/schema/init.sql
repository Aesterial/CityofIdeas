create extension if not exists pgcrypto;

-- Enums
create type user_rank as enum ('user', 'staff', 'developer');
create type event_level as enum ('info', 'warn', 'error', 'critical');
create type event_result as enum ('success', '-', 'fail');

create type users_email_t as (
                                 address varchar(255),
                                 verified boolean
                             );

create type users_rank_t as (
                                name user_rank,
                                expires timestamptz
                            );

create type avatar_t as (
                            content_type varchar(64),
                            data bytea,
                            width int,
                            height int,
                            size_bytes int,
                            updated timestamptz
                        );

create type user_settings_t as (
                                   display_name varchar(255),
                                   avatar avatar_t,
                                   password varchar(255),
                                   session_live_time int
                               );

-- Permissions
create table permissions (
                             key text primary key,
                             description text
);

create table ranks (
                       name user_rank primary key,
                       color int,
                       description text
);

create table rank_permissions (
                                  rank user_rank not null references ranks(name) on delete cascade,
                                  permission_key text not null references permissions(key) on delete cascade,
                                  primary key (rank, permission_key)
);

-- Users table with struct columns
create table users (
                       uid bigint generated always as identity primary key,
                       username varchar(64) not null,

                       email users_email_t not null,
                       settings user_settings_t not null,
                       rank users_rank_t not null,

                       joined timestamptz not null default now(),

    -- constraints for struct fields
                       constraint users_email_address_nn check (((email).address) is not null),
                       constraint users_email_verified_nn check (((email).verified) is not null),

                       constraint users_password_nn check (((settings).password) is not null),
                       constraint users_session_live_time_ok check (((settings).session_live_time) in (7, 30, -1)),

                       constraint users_rank_name_nn check (((rank).name) is not null),
                       constraint users_rank_expires_ok check (((rank).expires) is null or (rank).expires > joined)
);

-- Uniqueness / indexes on nested fields
create unique index users_username_uq on users (username);
create unique index users_email_uq on users (lower(((email).address)));
create index users_rank_name_idx on users (((rank).name));
create index users_joined_idx on users (joined);

-- Bans
create table bans (
                      id uuid primary key default pg_catalog.gen_random_uuid(),
                      executor bigint not null references users(uid) on delete restrict,
                      target bigint not null references users(uid) on delete restrict,
                      reason varchar(255),
                      at timestamptz not null default now(),
                      expires timestamptz,
                      check (expires is null or expires > at),
                      check (executor <> target)
);

create index bans_target_idx on bans(target);
create index bans_executor_idx on bans(executor);

-- Events
create table events (
                        id uuid primary key default pg_catalog.gen_random_uuid(),
                        at timestamptz not null default now(),

                        event_type varchar(255) not null,
                        level event_level not null,
                        message text,

                        actor_type varchar(255) not null,
                        actor_id bigint,

                        trace_id varchar(255) not null,
                        result event_result not null
);

create index events_at_idx on events(at);
create index events_trace_id_idx on events(trace_id);
