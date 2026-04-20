-- name: CreateUser :one
insert into users (username, email) VALUES ($1, $2) returning uid, username, email, joined;

-- name: CreateUserSecurity :one
insert into users_security (owner, password) VALUES ($1, $2) returning owner, password, email_verified, totp_enabled, totp_secret, totp_confirmed, totp_pending, totp_pending_created, totp_last_step;

-- name: CreateUserPreferences :one
insert into users_preferences (owner) VALUES ($1) returning owner, display_name, description, avatar_hash, session_live;

-- name: CreateUserDefaultRank :one
insert into users_ranks (owner, rank, expires) values ($1, (select id from ranks where name = 'user'), null) returning (select name from ranks where id = users_ranks.rank), (select color from ranks where id = users_ranks.rank), (select weight from ranks where id = users_ranks.rank), expires;

-- name: IsUserExists :one
select exists (select 1 from users where username = $1 or email = $1);

-- name: IsUserBanned :one
select exists (select 1 from users_bans where target = $1 and (expires is null or expires > now()));

-- name: GetUser :one
select uid, username, email, joined from users where uid = $1 limit 1;

-- name: GetUserByUserMail :one
select uid, username, email, joined from users where username = $1 or email = $1 limit 1;

-- name: GetUserId :one
select uid from users where email = $1 OR username = $1 limit 1;

-- name: GetUserPassword :one
select password from users_security where owner = $1 limit 1;

-- name: GetUsers :many
select uid, username, email, joined from users limit $1 offset $2;

-- name: GetUserPreferences :one
select owner, display_name, description, avatar_hash, session_live from users_preferences where owner = $1 limit 1;

-- name: GetUserRanks :many
select ranks.name, ranks.color, ranks.weight, users_ranks.expires from users_ranks join ranks on ranks.id = users_ranks.rank where users_ranks.owner = $1;

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
select expires > now() and device = $1 and hash = $2 from sessions where id = $3;

-- name: ExtendSession :exec
update sessions set expires = expires + $1 where id = $2;

-- name: SessionsByOwner :many
select id, owner, at, seen_at, expires, mfa, device, hash from sessions where owner = $1 limit $2 offset $3;

-- name: SessionInfo :one
select id, owner, at, seen_at, expires, mfa, device, hash from sessions where id = $1;

-- name: SetSessionLastSeen :exec
update sessions set seen_at = now() where id = $1;

-- name: TicketsByAuthor :many
select id, author, acceptor, status, topic, title, created, accepted, closed, closer, reason from tickets where author = $1 limit $2 offset $3;

-- name: OpenedTickets :many
select id, author, acceptor, status, topic, title, created, accepted, closed, closer, reason from tickets where closed is not null and acceptor is null limit $1 offset $2;

-- name: TicketInfo :one
select id, author, acceptor, status, topic, title, created, accepted, closed, closer, reason from tickets where id = $1 limit 1;

-- name: IsTicketClosed :one
select (closed is not null)::boolean as is_closed from tickets where id = $1;

-- name: IsTicketAccepted :one
select (acceptor is not null)::boolean as is_accepted from tickets where id = $1;

-- name: CreateTicket :one
insert into tickets (author, title, topic) VALUES ($1, $2, $3) returning id, author, acceptor, status, topic, title, created, accepted, closed, closer, reason;

-- name: AcceptTicket :exec
update tickets set acceptor = $1, accepted = now(), status = 'in work' where id = $2;

-- name: CloseTicket :exec
update tickets set status = 'closed', closed = now(), closer = $1, reason = $2 where id = $1;

-- name: ExpiredTickets :many
select ticket from tickets_messages group by ticket having max(created) < now() - $1::interval;

-- name: CreateTicketMessage :one
insert into tickets_messages (ticket, author, content) VALUES ($1, $2, $3) returning id, ticket, author, content, created;

-- name: TicketMessages :many
select id, ticket, author, content, created from tickets_messages where ticket = $1 limit $2 offset $3;