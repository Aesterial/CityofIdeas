create extension if not exists pgcrypto;

insert into ranks (name, permissions, weight)
values ('user',
        '{
          "ticket.create": {},
          "project.create": {},
          "project.message.create": {}
        }'::jsonb,
        10);

with generated_password as (select encode(gen_random_bytes(16), 'hex') as password),
     staff_rank as (
         insert into ranks (name, permissions, weight)
             values ('staff',
                     '{
                       "user.update.all": {},
                       "user.update.display_name": {},
                       "user.update.description": {},
                       "user.update.avatar": {},
                       "user.view.all": {},
                       "user.delete.all": {},
                       "rank.list": {},
                       "rank.info": {},
                       "rank.create": {},
                       "rank.update": {},
                       "rank.delete": {},
                       "ticket.create": {},
                       "ticket.view.all": {},
                       "ticket.accept": {},
                       "ticket.close": {},
                       "ticket.message.view.all": {},
                       "ticket.message.create": {},
                       "ticket.message.create.all": {},
                       "project.create": {},
                       "project.update.all": {},
                       "project.delete.all": {},
                       "project.update.close": {},
                       "project.update.approve": {},
                       "project.update.implement": {},
                       "project.submission.info": {},
                       "project.submission.list": {},
                       "project.submission.review": {},
                       "project.message.create": {},
                       "project.message.view.all": {},
                       "project.message.delete.all": {},
                       "maintenance.start": {},
                       "maintenance.stop": {}
                     }'::jsonb,
                     100)
             returning id),
     admin_user as (
         insert into users (username, email)
             values ('admin', 'admin@cityideas.aesterial.xyz')
             returning uid),
     insert_user_rank as (
         insert into users_ranks (owner, rank, expires)
             select admin_user.uid, staff_rank.id, null
             from admin_user,
                  staff_rank),
     insert_user_preferences as (
         insert into users_preferences (owner)
             select uid
             from admin_user),
     insert_user_security as (
         insert into users_security (
                                     owner,
                                     password,
                                     email_verified
             )
             select admin_user.uid,
                    crypt(
                            generated_password.password,
                            gen_salt('bf', 12)
                    ),
                    true
             from admin_user,
                  generated_password)
select admin_user.uid                  as admin_uid,
       staff_rank.id                   as staff_rank_id,
       'admin'                         as username,
       'admin@cityideas.aesterial.xyz' as email,
       generated_password.password     as generated_password
from admin_user,
     staff_rank,
     generated_password;