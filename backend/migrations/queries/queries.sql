-- name: CreateUser :one
insert into users (username, email) VALUES ($1, $2) returning uid, username, email, joined;

-- name: CreateUserSecurity :one
insert into users_security (owner, password) VALUES ($1, $2) returning owner, password, email_verified, totp_enabled, totp_secret, totp_confirmed, totp_pending, totp_pending_created, totp_last_step;

-- name: CreateCity :one
insert into cities (name) values ($1) returning id, name, at;

-- name: ListCities :many
select id, name, at from cities order by name limit $1 offset $2;

-- name: CityInfo :one
select id, name, at from cities where id = $1 limit 1;

-- name: CityByName :one
select id, name, at from cities where name = $1 limit 1;

-- name: DeleteCity :exec
delete from cities where id = $1;

-- name: CreateUserPreferences :one
insert into users_preferences (owner)
VALUES ($1)
returning owner, display_name, description, avatar_hash, session_live, language, city_id, city_changed;

-- name: CreateUserDefaultRank :one
insert into users_ranks (owner, rank, city_id, expires) values ($1, (select id from ranks where name = 'user'), null, null) returning (select name from ranks where id = users_ranks.rank), (select color from ranks where id = users_ranks.rank), (select weight from ranks where id = users_ranks.rank), expires;

-- name: AssignRankToUser :exec
insert into users_ranks (owner, rank, city_id, expires)
select $1::uuid, id, $2::uuid, $3::timestamptz
from ranks
where name = $4;

-- name: RevokeRankFromUserScoped :exec
update users_ranks set expires = now()
from ranks
where users_ranks.rank = ranks.id
  and ranks.name = $1
  and users_ranks.owner = $2
  and users_ranks.city_id is not distinct from $3::uuid;

-- name: GetUserRanksWithScope :many
select ranks.id, ranks.name, ranks.color, ranks.weight, ranks.permissions, users_ranks.expires, users_ranks.city_id
from users_ranks
         join ranks on ranks.id = users_ranks.rank
where users_ranks.owner = $1
  and (users_ranks.expires is null or users_ranks.expires > now());

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
select owner, display_name, description, avatar_hash, session_live, language, city_id, city_changed
from users_preferences
where owner = $1
limit 1;

-- name: GetUserRanks :many
select ranks.id, ranks.name, ranks.color, ranks.weight, ranks.permissions, users_ranks.expires
from users_ranks
         join ranks on ranks.id = users_ranks.rank
where users_ranks.owner = $1;

-- name: GetUserSecurity :one
select owner, password, email_verified, totp_enabled, totp_secret, totp_confirmed, totp_pending, totp_pending_created, totp_last_step from users_security where owner = $1 limit 1;

-- name: GetUserRecoveryCodes :many
select owner, selector, hash, used, created
from users_security_codes
where owner = $1;

-- name: GetUserRecoveryCodesWithSelector :one
select owner, selector, hash, used, created
from users_security_codes
where owner = $1
  and selector = $2
limit 1;

-- name: UseRecoveryCode :exec
update users_security_codes
set used = now()
where selector = $1;

-- name: InsertRecoveryCodes :copyfrom
insert into users_security_codes (owner, selector, hash)
values ($1, $2, $3);

-- name: SetTotpLastSeen :exec
update users_security
set totp_last_step = $1
where owner = $2;

-- name: ResetTotp :exec
update users_security
set totp_enabled         = false,
    totp_pending         = null,
    totp_confirmed       = null,
    totp_secret          = null,
    totp_last_step       = null,
    totp_pending_created = null
where owner = $1;

-- name: ResetTotpCodes :exec
delete
from users_security_codes
where owner = $1;

-- name: UpdateUserDisplayName :exec
update users_preferences set display_name = $1 where owner = $2;

-- name: UpdateUserDescription :exec
update users_preferences set description = $1 where owner = $2;

-- name: UpdateUserAvatar :exec
update users_preferences set avatar_hash = $1 where owner = $2;

-- name: UpdateUserSessionLive :exec
update users_preferences set session_live = $1 where owner = $2;

-- name: UpdateUserLanguage :exec
update users_preferences
set language = $1
where owner = $2;

-- name: UpdateUserCityByID :exec
update users_preferences set city_id = $1, city_changed = now() where owner = $2;

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

-- name: IsSessionCompleteMFA :one
select not (users_security.totp_enabled is true and sessions.mfa is not true) from sessions join users_security on users_security.owner = sessions.owner where sessions.id = $1;

-- name: ExtendSession :exec
update sessions set expires = expires + $1 where id = $2;

-- name: SessionsByOwner :many
select id, owner, at, seen_at, expires, mfa, device, hash from sessions where owner = $1 limit $2 offset $3;

-- name: SessionInfo :one
select id, owner, at, seen_at, expires, mfa, device, hash from sessions where id = $1;

-- name: SetSessionLastSeen :exec
update sessions set seen_at = now() where id = $1;

-- name: TicketsByAuthor :many
select id,
       author,
       acceptor,
       status,
       topic,
       title,
       created,
       accepted,
       closed,
       closer,
       caller,
       reason
from tickets
where author = $1
limit $2 offset $3;

-- name: Tickets :many
select id,
       author,
       acceptor,
       status,
       topic,
       title,
       created,
       accepted,
       closed,
       closer,
       caller,
       reason
from tickets
limit $1 offset $2;

-- name: TicketInfo :one
select id,
       author,
       acceptor,
       status,
       topic,
       title,
       created,
       accepted,
       closed,
       closer,
       caller,
       reason
from tickets
where id = $1
limit 1;

-- name: TicketOwner :one
select author
from tickets
where id = $1
limit 1;

-- name: IsTicketClosed :one
select (closed is not null)::boolean as is_closed from tickets where id = $1;

-- name: IsTicketAccepted :one
select (acceptor is not null)::boolean as is_accepted from tickets where id = $1;

-- name: CreateTicket :one
insert into tickets (author, title, topic)
VALUES ($1, $2, $3)
returning id, author, acceptor, status, topic, title, created, accepted, closed, closer, caller, reason;

-- name: AcceptTicket :exec
update tickets set acceptor = $1, accepted = now(), status = 'in work' where id = $2;

-- name: CloseTicket :exec
update tickets
set status = 'closed',
    closed = now(),
    closer = $1,
    caller = $2,
    reason = $3
where id = $4;

-- name: ExpiredTickets :many
select ticket from tickets_messages group by ticket having max(created) < now() - $1::interval;

-- name: CreateTicketMessage :one
insert into tickets_messages (ticket, author, content) VALUES ($1, $2, $3) returning id, ticket, author, content, created;

-- name: TicketMessages :many
select id, ticket, author, content, created from tickets_messages where ticket = $1 limit $2 offset $3;

-- name: CreateProject :one
insert into projects (author, title, description, category)
values ($1, $2, $3, $4)
returning id, author, title, description, category, status, impl_link, at, updated, deleted;

-- name: CreateProjectLocation :one
insert into project_location (id, city_id, lat, lot)
values ($1, $2, $3, $4)
returning id, city_id, lat, lot;

-- name: ProjectsList :many
select projects.id,
       projects.author,
       title,
       description,
       category,
       status,
       impl_link,
       count(project_likes.project)::bigint as likes_count,
       projects.at,
       updated,
       deleted,
       project_location.city_id,
       project_location.lat,
       project_location.lot
from projects
         left join project_likes
                   on project_likes.project = projects.id
         left join project_location
                   on project_location.id = projects.id
where status <> 'reviewing'
  and status <> 'cancelled'
group by projects.id,
         projects.author,
         title,
         description,
         category,
         status,
         impl_link,
         projects.at,
         updated,
         deleted,
         project_location.city_id,
         project_location.lat,
         project_location.lot
limit $1 offset $2;

-- name: ProjectsTop :many
select p.id,
       p.author,
       p.title,
       p.description,
       p.category,
       count(l.project)::bigint as likes_count,
       p.status,
       p.impl_link,
       p.at,
       p.updated,
       p.deleted
from projects p
         join project_location pl on pl.id = p.id
         left join project_likes l on l.project = p.id
where p.status not in ('reviewing', 'cancelled', 'implemented')
  and pl.city_id = $1
group by p.id
order by count(l.project) desc, p.at desc
limit $2 offset $3;

-- name: ProjectInfo :one
select projects.id,
       projects.author,
       title,
       description,
       category,
       count(project_likes.project)::bigint as likes_count,
       status,
       impl_link,
       projects.at,
       updated,
       deleted,
       project_location.city_id,
       project_location.lat,
       project_location.lot
from projects
         left join project_likes on project_likes.project = projects.id
         left join project_location on project_location.id = projects.id
where projects.id = $1
group by projects.id, projects.author, title, description, category, status, impl_link, projects.at, updated, deleted, project_location.city_id, project_location.lat, project_location.lot
limit 1;

-- name: ProjectLocationInfo :one
select id, city_id, lat, lot
from project_location
where id = $1;

-- name: ProjectCityID :one
select city_id from project_location where id = $1 limit 1;

-- name: ProjectAuthor :one
select author
from projects
where id = $1
limit 1;

-- name: SetProjectStatus :exec
update projects set status = $1, impl_link = $2 where id = $3;

-- name: UpdateProjectDescription :exec
update projects set description = $1, updated = now() where id = $2;

-- name: CreateSubmission :one
insert into submissions (linked) VALUES ($1) returning id, linked, reason, approved, reviewed_by, reviewed_at;

-- name: SubmissionsList :many
select id, linked, approved, reason, reviewed_by, reviewed_at from submissions limit $1 offset $2;

-- name: SubmissionInfo :one
select id, linked, approved, reason, reviewed_by, reviewed_at from submissions where id = $1 limit 1;

-- name: AcceptSubmission :exec
update submissions
set approved = true, reviewed_by = $1, reviewed_at = now()
where linked = $2;

-- name: DenySubmission :exec
update submissions
set approved     = false,
    reason       = $1,
    reviewed_by  = $2,
    reviewed_at  = now()
where linked = $3;

-- name: IsSubmissionReviewed :one
select (reviewed_at is not null)::boolean
from submissions
where linked = $1;

-- name: CreateMessage :one
insert into project_messages (linked, author, parent, content) values ($1, $2, $3, $4) returning id, linked, author, parent, content, at, deleted;

-- name: MessageAuthor :one
select author
from project_messages
where id = $1
limit 1;

-- name: MessagesList :many
select id, linked, author, parent, content, at, deleted from project_messages where linked = $1 and deleted is null limit $2 offset $3;

-- name: MessagesListWithDeleted :many
select id, linked, author, parent, content, at, deleted
from project_messages
where linked = $1
limit $2 offset $3;

-- name: MessageInfo :one
select id, linked, author, parent, content, at, deleted from project_messages where id = $1 limit 1;

-- name: DeleteMessage :exec
update project_messages set deleted = now() where id = $1;

-- name: DeleteProject :exec
update projects set deleted = now(), status = 'cancelled' where id = $1;

-- name: CreateRank :one
insert into ranks (name, description, color, weight, permissions) values ($1, $2, $3, $4, $5) returning id, name, description, color, weight, permissions, added_at;

-- name: RankInfo :one
select id, name, description, color, weight, permissions, added_at from ranks where name = $1 limit 1;

-- name: RankInfoByID :one
select id, name, description, color, weight, permissions, added_at from ranks where id = $1 limit 1;

-- name: RanksList :many
select id, name, description, color, weight, permissions, added_at from ranks limit $1 offset $2;

-- name: DeleteRank :exec
delete
from ranks
where id = $1;

-- name: IsRankExists :one
select exists (select 1 from ranks where name = $1);

-- name: RankUsers :many
select owner from users_ranks join ranks on ranks.id = users_ranks.rank where ranks.name = $1;

-- name: RevokeRankFromUser :exec
update users_ranks set expires = now() from ranks where users_ranks.rank = ranks.id and ranks.name = $1 and users_ranks.owner = $2;

-- name: SetUserRank :exec
insert into users_ranks (owner, rank, expires)
values ($1, (select id from ranks where ranks.name = $2), $3)
on conflict (owner) do update set rank = (select id from ranks where name = $2), expires = $3;

-- name: UpdateRankName :exec
update ranks set name = $1 where id = $2;

-- name: UpdateRankDescription :exec
update ranks set description = $1 where id = $2;

-- name: UpdateRankColor :exec
update ranks set color = $1 where id = $2;

-- name: UpdateRankWeight :exec
update ranks set weight = $1 where id = $2;

-- name: UpdateRankPermissions :exec
update ranks set permissions = $1 where id = $2;

-- name: CreateMaintenance :one
insert into maintenances (description, planned_start, planned_end, caller) values ($1, $2, $3, $4) returning id, description, status, type, planned_start, planned_end, actual_start, actual_end, caller, created;

-- name: HasActiveMaintenance :one
select exists (select 1
               from maintenances
               where status = 'running' or (planned_start < now() and actual_end is not null));

-- name: ActiveMaintenance :one
select id, description, status, type, planned_start, planned_end, actual_start, actual_end, caller, created from maintenances where status = 'running' or (planned_start < now() and actual_end is not null) limit 1;

-- name: MaintenancesHistory :many
select id, description, status, type, planned_start, planned_end, actual_start, actual_end, caller, created from maintenances limit $1 offset $2;

-- name: StartMaintenance :exec
update maintenances set status = 'running', actual_start = now() where id = $1;

-- name: EndMaintenance :exec
update maintenances set status = 'completed', actual_end = now() where id = $1;

-- name: PlannedMaintenance :one
select planned_start, description
from maintenances
where status = 'expected'
limit 1;

-- name: GlobalStats :one
select coalesce((select c.name from project_location pl join cities c on c.id = pl.city_id group by c.name order by count(*) desc limit 1),'нет')::text as most_popular_city,coalesce((select count(*) from project_location group by city_id order by count(*) desc limit 1),0) as most_popular_city_projects_count,(select count(*) from project_likes) as likes_count,(select count(*) from projects where impl_link is not null and status='implemented') as implemented_count,(select count(*) from projects) as ideas_count,(select coalesce(avg(extract(epoch from (accepted-created))/3600),0)::double precision from tickets where accepted is not null) as avg_tickets_response;

-- name: ProjectVotesGraph :many
with period as (select case sqlc.arg(separator)::text
                           when 'hourly' then date_trunc('hour', now()) - interval '23 hours'
                           when 'weekly' then date_trunc('week', now() - interval '1 month')
                           else date_trunc('day', now()) - interval '6 days'
                           end as start_at,
                       case sqlc.arg(separator)::text
                           when 'hourly' then date_trunc('hour', now())
                           when 'weekly' then date_trunc('week', now())
                           else date_trunc('day', now())
                           end as end_at,
                       case sqlc.arg(separator)::text
                           when 'hourly' then interval '1 hour'
                           when 'weekly' then interval '1 week'
                           else interval '1 day'
                           end as bucket_interval),
     series as (select generate_series(period.start_at, period.end_at, period.bucket_interval) as at,
                       period.bucket_interval
                from period),
     events as (select project_likes.at
                from project_likes
                         join projects on projects.id = project_likes.project
                         join project_location on project_location.id = projects.id
                         cross join period
                where project_likes.at >= period.start_at
                  and project_likes.at < period.end_at + period.bucket_interval
                  and (sqlc.narg(city)::uuid is null or project_location.city_id = sqlc.narg(city)::uuid))
select series.at::timestamptz   as at,
       count(events.at)::bigint as value
from series
         left join events on events.at >= series.at and events.at < series.at + series.bucket_interval
group by series.at
order by series.at;

-- name: ProjectCreationGraph :many
with period as (select case sqlc.arg(separator)::text
                           when 'hourly' then date_trunc('hour', now()) - interval '23 hours'
                           when 'weekly' then date_trunc('week', now() - interval '1 month')
                           else date_trunc('day', now()) - interval '6 days'
                           end as start_at,
                       case sqlc.arg(separator)::text
                           when 'hourly' then date_trunc('hour', now())
                           when 'weekly' then date_trunc('week', now())
                           else date_trunc('day', now())
                           end as end_at,
                       case sqlc.arg(separator)::text
                           when 'hourly' then interval '1 hour'
                           when 'weekly' then interval '1 week'
                           else interval '1 day'
                           end as bucket_interval),
     series as (select generate_series(period.start_at, period.end_at, period.bucket_interval) as at,
                       period.bucket_interval
                from period),
     events as (select projects.at
                from projects
                         join project_location on project_location.id = projects.id
                         cross join period
                where projects.at >= period.start_at
                  and projects.at < period.end_at + period.bucket_interval
                  and (sqlc.narg(city)::uuid is null or project_location.city_id = sqlc.narg(city)::uuid))
select series.at::timestamptz   as at,
       count(events.at)::bigint as value
from series
         left join events on events.at >= series.at and events.at < series.at + series.bucket_interval
group by series.at
order by series.at;

-- name: QuestionsGraph :many
with period as (select case sqlc.arg(separator)::text
                           when 'hourly' then date_trunc('hour', now()) - interval '23 hours'
                           when 'weekly' then date_trunc('week', now() - interval '1 month')
                           else date_trunc('day', now()) - interval '6 days'
                           end as start_at,
                       case sqlc.arg(separator)::text
                           when 'hourly' then date_trunc('hour', now())
                           when 'weekly' then date_trunc('week', now())
                           else date_trunc('day', now())
                           end as end_at,
                       case sqlc.arg(separator)::text
                           when 'hourly' then interval '1 hour'
                           when 'weekly' then interval '1 week'
                           else interval '1 day'
                           end as bucket_interval),
     series as (select generate_series(period.start_at, period.end_at, period.bucket_interval) as at,
                       period.bucket_interval
                from period),
     events as (select tickets.created as at
                from tickets
                         cross join period
                where tickets.created >= period.start_at
                  and tickets.created < period.end_at + period.bucket_interval)
select series.at::timestamptz   as at,
       count(events.at)::bigint as value
from series
         left join events on events.at >= series.at and events.at < series.at + series.bucket_interval
group by series.at
order by series.at;

-- name: ProjectDiscussionGraph :many
with period as (select case sqlc.arg(separator)::text
                           when 'hourly' then date_trunc('hour', now()) - interval '23 hours'
                           when 'weekly' then date_trunc('week', now() - interval '1 month')
                           else date_trunc('day', now()) - interval '6 days'
                           end as start_at,
                       case sqlc.arg(separator)::text
                           when 'hourly' then date_trunc('hour', now())
                           when 'weekly' then date_trunc('week', now())
                           else date_trunc('day', now())
                           end as end_at,
                       case sqlc.arg(separator)::text
                           when 'hourly' then interval '1 hour'
                           when 'weekly' then interval '1 week'
                           else interval '1 day'
                           end as bucket_interval),
     series as (select generate_series(period.start_at, period.end_at, period.bucket_interval) as at,
                       period.bucket_interval
                from period),
     events as (select project_messages.at
                from project_messages
                         join projects on projects.id = project_messages.linked
                         join project_location on project_location.id = projects.id
                         cross join period
                where project_messages.deleted is null
                  and project_messages.at >= period.start_at
                  and project_messages.at < period.end_at + period.bucket_interval
                  and (sqlc.narg(city)::uuid is null or project_location.city_id = sqlc.narg(city)::uuid))
select series.at::timestamptz   as at,
       count(events.at)::bigint as value
from series
         left join events on events.at >= series.at and events.at < series.at + series.bucket_interval
group by series.at
order by series.at;

-- name: IsProjectExists :one
select exists (select 1 from projects where id = $1);

-- name: IsProjectLikeExists :one
select exists (select 1 from project_likes where project = $1 and author = $2);

-- name: CreateProjectLike :exec
insert into project_likes (project, author) values ($1, $2);

-- name: RemoveProjectLike :exec
delete from project_likes where project = $1 and author = $2;

-- name: CreateAction :one
insert into users_actions (owner, purpose, hash, expires) values ($1, $2, $3, $4) returning id, owner, purpose, hash, at, expires, used;

-- name: UseAction :exec
update users_actions set used = now() where hash = $1 and purpose = $2;

-- name: FindAction :one
select id, owner, purpose, hash, at, expires, used from users_actions where hash = $1 and purpose = $2 limit 1;

-- name: ActionsByOwner :many
select id, owner, purpose, hash, at, expires, used from users_actions where owner = $1;

-- name: IsActionValid :one
select (used is null and expires > now())::boolean as is_valid from users_actions where hash = $1 and purpose = $2 limit 1;

-- name: BanUser :exec
insert into users_bans (executor, target, reason, expires) values ($1, $2, $3, $4);

-- name: UnbanUser :exec
UPDATE users_bans SET remove = $1, expires = now() WHERE target = $2 AND (expires > now() OR expires IS NULL) AND remove IS NULL;

-- name: CreateFile :one
insert into files (owner, purpose, mime_type, size, key, bucket)
values ($1, $2, $3, $4, $5, $6)
returning id, owner, purpose, mime_type, size, key, bucket, created_at;

-- name: GetFile :one
select id,
       owner,
       purpose,
       mime_type,
       size,
       key,
       bucket,
       created_at
from files
where id = $1
limit 1;

-- name: GetFilesByOwner :many
select id,
       owner,
       purpose,
       mime_type,
       size,
       key,
       bucket,
       created_at
from files
where owner = $1;

-- name: CanLikeProject :one
select coalesce(up.city_id = pl.city_id, false)::boolean as is_city_match
from users_preferences up
         left join project_location pl on pl.id = $2
where up.owner = $1
limit 1;