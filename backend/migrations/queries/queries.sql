-- name: CreateUser :one
insert into users (username, email) VALUES ($1, $2) returning uid, username, email, joined;

-- name: CreateUserSecurity :one
insert into users_security (owner, password) VALUES ($1, $2) returning owner, password, email_verified, totp_enabled, totp_secret, totp_confirmed, totp_pending, totp_pending_created, totp_last_step;

-- name: CreateUserPreferences :one
insert into users_preferences (owner) VALUES ($1) returning owner, display_name, description, avatar_hash, session_live;

-- name: IsUserExists :one
select exists (select 1 from users where username = $1 OR email = $2);

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

-- name: GetUserRecoveryCodes :many
select owner, hash, used, created from users_security_codes where owner = $1;

-- name: UseRecoveryCode :exec
update users_security_codes set used = now() where hash = $1;

-- name: InsertRecoveryCodes :copyfrom
insert into users_security_codes (owner, hash) values ($1, $2);

-- name: UpdateUserDisplayName :exec
update users_preferences set display_name = $1 where owner = $2;

-- name: UpdateUserDescription :exec
update users_preferences set description = $1 where owner = $2;

-- name: UpdateUserAvatar :exec
update users_preferences set avatar_hash = $1 where owner = $2;

-- name: UpdateUserSessionLive :exec
update users_preferences set session_live = $1 where owner = $2;

-- name: UpdateUserPassword :exec
update users_security set password = $1 where owner = $2;

-- name: SetUserSecurityEmailVerified :exec
update users_security set email_verified = true where owner = $1;

-- name: StartUserSecurityTotp :exec
update users_security set owner = $1, totp_pending = $2, totp_pending_created = now() where owner = $1;

-- name: EndUserSecurityTotp :exec
update users_security set totp_enabled = true, totp_secret = totp_pending, totp_confirmed = now(), totp_pending = null, totp_pending_created = null where owner = $1;

-- name: CreateSession :one
insert into sessions (owner, expires, device, hash) VALUES ($1, $2, $3, $4) returning id, owner, at, seen_at, expires, mfa, device, hash;

-- name: RevokeSession :exec
update sessions set expires = now() where id = $1;

-- name: IsSessionValid :one
select expires > now() from sessions where owner = $1;

-- name: ExtendSession :exec
update sessions set expires = expires + $1 where id = $2;

-- name: SessionsByOwner :many
select id, owner, at, seen_at, expires, mfa, device, hash from sessions where owner = $1;

-- name: SessionInfo :one
select id, owner, at, seen_at, expires, mfa, device, hash from sessions where id = $1;