-- name: CreateUser :one
insert into users (username, email) VALUES ($1, $2) returning uid, username, email, joined;

-- name: CreateUserSecurity :exec
insert into users_security (owner, password) VALUES ($1, $2);

-- name: CreateUserPreferences :exec
insert into users_preferences (owner) VALUES ($1);

-- name: GetUser :one
select id, username, email, joined from users where uid = $1 limit 1;

-- name: GetUserPassword :one
select password from users_security where uid = $1 limit 1;

-- name: GetUsers :many
select id, username, email, joined from users limit $1 offset $2;

-- name: UpdateUserPreferences :exec
update users_preferences set description = (if ($1 <> description) -> $1);