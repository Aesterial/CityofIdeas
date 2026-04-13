-- name: CreateUser :one
insert into users (username, email) VALUES ($1, $2) returning uid, username, email, joined;

-- name: CreateUserSecurity :one
insert into users_security (owner, password) VALUES ($1, $2) returning owner, password, email_verified, totp_enabled, totp_secret, totp_confirmed, totp_pending, totp_pending_created, totp_last_step;

-- name: CreateUserPreferences :one
insert into users_preferences (owner) VALUES ($1) returning owner, display_name, description, avatar_hash, session_live;

-- name: GetUser :one
select uid, username, email, joined from users where uid = $1 limit 1;

-- name: GetUserId :one
select uid from users where email = $1 limit 1;

-- name: GetUserPassword :one
select password from users_security where owner = $1 limit 1;

-- name: GetUsers :many
select uid, username, email, joined from users limit $1 offset $2;

-- name: GetUserPreferences :one
select owner, display_name, description, avatar_hash, session_live from users_preferences where owner = $1 limit 1;

-- name: GetUserSecurity :one
select owner, password, email_verified, totp_enabled, totp_secret, totp_confirmed, totp_pending, totp_pending_created, totp_last_step from users_security where owner = $1 limit 1;