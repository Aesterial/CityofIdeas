create extension if not exists pgcrypto;

insert into cities (name) values
                            ('Москва'),
                            ('Воронеж'),
                            ('Ростов-на-Дону'),
                            ('Волгоград'),
                            ('Астрахань'),
                            ('Саратов'),
                            ('Самара'),
                            ('Казань'),
                            ('Уфа'),
                            ('Оренбург'),
                            ('Магнитогорск'),
                            ('Челябинск'),
                            ('Екатеринбург'),
                            ('Нижний Тагил'),
                            ('Курган'),
                            ('Тюмень'),
                            ('Омск'),
                            ('Томск'),
                            ('Новосибирск'),
                            ('Барнаул'),
                            ('Бийск'),
                            ('Кемерово'),
                            ('Новокузнецк'),
                            ('Сургут'),
                            ('Нижневартовск'),
                            ('Ханты-Мансийск'),
                            ('Ноябрьск'),
                            ('Новый Уренгой'),
                            ('Красноярск'),
                            ('Абакан'),
                            ('Норильск'),
                            ('Братск'),
                            ('Иркутск'),
                            ('Ангарск'),
                            ('Улан-Удэ'),
                            ('Чита'),
                            ('Кызыл'),

                            ('Якутск'),
                            ('Нерюнгри'),
                            ('Благовещенск'),
                            ('Биробиджан'),
                            ('Хабаровск'),
                            ('Комсомольск-на-Амуре'),
                            ('Уссурийск'),
                            ('Находка'),
                            ('Владивосток'),
                            ('Южно-Сахалинск'),
                            ('Корсаков'),
                            ('Магадан'),
                            ('Петропавловск-Камчатский'),
                            ('Анадырь');

insert into ranks (name, permissions, weight)
values ('user',
        '{
          "ticket.create": {},
          "project.create": {},
          "project.message.create": {}
        }'::jsonb,
        10);

insert into ranks (name, permissions, weight)
values ('city_administrator',
        '{
          "project.submission.list": {},
          "project.submission.info": {},
          "project.submission.review": {},
          "project.update.implement": {},
          "project.update.implemented": {},
          "project.message.view.all": {},
          "project.message.delete.all": {}
        }'::jsonb,
        50);

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
                       "user.ban": {},
                       "user.unban": {},
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
                       "statistics.votes": {},
                       "statistics.creation": {},
                       "statistics.questions": {},
                       "statistics.discussion": {},
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
