insert into ranks (name, color, description, permissions)
values
    (
        'user',
        null,
        'Default user',
        row(
            true,
            false,
            true,
            false,
            false,
            false,
            true,
            true,
            true,
            false,
            false,
            true,
            true,
            true,
            false,
            true,
            true,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false
        )::permissions_t
    ),
    (
        'staff',
        null,
        'Staff member',
        row(
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            false
        )::permissions_t
    ),
    (
        'developer',
        null,
        'Developer',
        row(
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true
        )::permissions_t
    )
on conflict (name) do update
set
    color = excluded.color,
    description = excluded.description,
    permissions = excluded.permissions;

create table if not exists seed_credentials (
    username varchar(64) primary key,
    email varchar(255) not null,
    password text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

do $$
declare
    v_password text;
    v_password_hash text;
    v_uid bigint;
begin
    select u.uid
    into v_uid
    from users u
    where u.username = 'admin'
        or lower((u.email).address) = 'admin@ascendant.ru'
    limit 1;

    if v_uid is null then
        v_password := encode(gen_random_bytes(16), 'hex');
        v_password_hash := crypt(v_password, gen_salt('bf', 12));

        insert into users (username, email, rank, permissions, password)
        values (
            'admin',
            row('admin@ascendant.ru', true)::users_email_t,
            row('staff', null)::users_rank_t,
            (select r.permissions from ranks r where r.name = 'staff'),
            v_password_hash
        )
        returning uid into v_uid;

        insert into seed_credentials (username, email, password)
        values ('admin', 'admin@ascendant.ru', v_password)
        on conflict (username) do update
        set
            email = excluded.email,
            password = excluded.password,
            updated_at = now();
    else
        update users
        set rank = row('staff', null)::users_rank_t
        where uid = v_uid
            and (rank).name is distinct from 'staff';
    end if;
end $$;
