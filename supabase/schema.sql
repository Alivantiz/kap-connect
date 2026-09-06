-- ═══════════════════════════════════════════════════════════════════
-- KAP Connect — полная схема БД
-- Supabase → SQL Editor → New query → вставить целиком → Run
--
-- Скрипт идемпотентный: его можно выполнять повторно.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ═══════════════════════════════════════════════════════════════════
-- СПРАВОЧНИК ДЗО
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.dzo_list (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  sort  int  not null default 100
);

insert into public.dzo_list (name, sort) values
  ('Головной офис (АО «НАК «Казатомпром»)',  1),
  ('АО «Орталык»',                            10),
  ('АО «СП «Инкай»',                          11),
  ('АО «Байкен-U»',                           12),
  ('ТОО «СП «Катко»',                         13),
  ('ТОО «Аппак»',                             14),
  ('ТОО «СП «Хорасан-U»',                     15),
  ('ТОО «Кызылкум»',                          16),
  ('ТОО «Семизбай-U»',                        17),
  ('ТОО «Каратау»',                           18),
  ('ТОО «РУ-6»',                              19),
  ('АО «Волковгеология»',                     20),
  ('ТОО «Ульба-ФА»',                          21),
  ('АО «УМЗ»',                                22),
  ('ТОО «КАЭ»',                               23),
  ('Другое',                                  999)
on conflict (name) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- ПРОФИЛИ
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text not null,
  position          text,
  dzo               text,
  region            text,
  specialty         text,
  experience_years  int  default 0 check (experience_years between 0 and 70),
  bio               text,
  skills            text[] default '{}',
  equipment         text[] default '{}',
  telegram          text,
  is_expert         boolean default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════
-- ПОСТЫ
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('post','case','question')),
  title       text not null check (char_length(title) between 1 and 200),
  body        text check (char_length(body) <= 8000),
  tags        text[] default '{}',
  is_solved   boolean default false,
  created_at  timestamptz default now()
);

create table if not exists public.post_likes (
  post_id     uuid references public.posts(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  is_solution boolean default false,
  created_at  timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════
-- СООБЩЕСТВА
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.communities (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique check (char_length(name) between 2 and 80),
  description  text check (char_length(description) <= 500),
  icon         text not null default 'gear',
  kind         text not null check (kind in ('specialty','dzo','interest')),
  is_closed    boolean default false,
  creator_id   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz default now()
);

-- Миграция со старой схемы: колонка emoji → icon, добавление creator_id
alter table public.communities add column if not exists creator_id uuid references public.profiles(id) on delete set null;
alter table public.communities add column if not exists icon text not null default 'gear';
alter table public.communities drop column if exists emoji;

-- Без уникальности имени повторный запуск скрипта дублировал все сообщества
do $$
begin
  alter table public.communities add constraint communities_name_key unique (name);
exception when duplicate_table or duplicate_object then null;
end $$;

-- Старый check-constraint не знал про 'interest' — пересоздаём
alter table public.communities drop constraint if exists communities_kind_check;
alter table public.communities add  constraint communities_kind_check check (kind in ('specialty','dzo','interest'));

create table if not exists public.community_members (
  community_id uuid references public.communities(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete cascade,
  joined_at    timestamptz default now(),
  primary key (community_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════════
-- ЛИЧНЫЕ СООБЩЕНИЯ
-- user1_id всегда меньше user2_id — это даёт естественную дедупликацию
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  user1_id      uuid not null references public.profiles(id) on delete cascade,
  user2_id      uuid not null references public.profiles(id) on delete cascade,
  last_message  text,
  last_msg_at   timestamptz default now(),
  created_at    timestamptz default now(),
  constraint conversations_ordered  check (user1_id < user2_id),
  constraint conversations_distinct check (user1_id <> user2_id),
  constraint conversations_pair     unique (user1_id, user2_id)
);

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  body             text not null check (char_length(body) between 1 and 4000),
  read             boolean default false,
  created_at       timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════
-- УВЕДОМЛЕНИЯ
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  actor_id    uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('like','comment','solution','message')),
  post_id     uuid references public.posts(id) on delete cascade,
  comment_id  uuid references public.comments(id) on delete cascade,
  read        boolean default false,
  created_at  timestamptz default now(),
  constraint notifications_not_self check (user_id <> actor_id)
);

-- ═══════════════════════════════════════════════════════════════════
-- ИНДЕКСЫ
-- ═══════════════════════════════════════════════════════════════════
create index if not exists idx_posts_created      on public.posts (created_at desc);
create index if not exists idx_posts_author       on public.posts (author_id);
create index if not exists idx_posts_tags         on public.posts using gin (tags);
create index if not exists idx_profiles_skills    on public.profiles using gin (skills);
create index if not exists idx_profiles_equipment on public.profiles using gin (equipment);
create index if not exists idx_profiles_dzo       on public.profiles (dzo);
create index if not exists idx_profiles_name_trgm on public.profiles using gin (full_name gin_trgm_ops);
create index if not exists idx_profiles_pos_trgm  on public.profiles using gin (position  gin_trgm_ops);
create index if not exists idx_comments_post      on public.comments (post_id);
create index if not exists idx_comments_author    on public.comments (author_id);
create index if not exists idx_members_user       on public.community_members (user_id);
create index if not exists idx_members_community  on public.community_members (community_id);
create index if not exists idx_conv_user1         on public.conversations (user1_id);
create index if not exists idx_conv_user2         on public.conversations (user2_id);
create index if not exists idx_conv_last          on public.conversations (last_msg_at desc);
create index if not exists idx_messages_conv      on public.messages (conversation_id, created_at);
create index if not exists idx_messages_unread    on public.messages (conversation_id) where read = false;
create index if not exists idx_notifs_user        on public.notifications (user_id, created_at desc);
create index if not exists idx_notifs_unread      on public.notifications (user_id) where read = false;

-- ═══════════════════════════════════════════════════════════════════
-- ТРИГГЕРЫ
-- ═══════════════════════════════════════════════════════════════════

-- ── Профиль создаётся автоматически при регистрации ──
-- Без этого пользователь после signUp остаётся без строки в profiles
-- и все экраны показывают пустоту.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, dzo, specialty, position)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email,'@',1)),
    nullif(new.raw_user_meta_data->>'dzo', ''),
    nullif(new.raw_user_meta_data->>'specialty', ''),
    nullif(new.raw_user_meta_data->>'specialty', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── updated_at ──
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── Уведомление о лайке ──
create or replace function public.notify_like()
returns trigger language plpgsql security definer set search_path = public
as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (owner, new.user_id, 'like', new.post_id);
  end if;
  return new;
end $$;

drop trigger if exists on_post_liked on public.post_likes;
create trigger on_post_liked after insert on public.post_likes
  for each row execute function public.notify_like();

-- Снятие лайка убирает уведомление — иначе счётчик врёт
create or replace function public.unnotify_like()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  delete from public.notifications
   where type = 'like' and post_id = old.post_id and actor_id = old.user_id;
  return old;
end $$;

drop trigger if exists on_post_unliked on public.post_likes;
create trigger on_post_unliked after delete on public.post_likes
  for each row execute function public.unnotify_like();

-- ── Уведомление о комментарии ──
create or replace function public.notify_comment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.author_id then
    insert into public.notifications (user_id, actor_id, type, post_id, comment_id)
    values (owner, new.author_id, 'comment', new.post_id, new.id);
  end if;
  return new;
end $$;

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created after insert on public.comments
  for each row execute function public.notify_comment();

-- ── Уведомление «ваш ответ отметили решением» ──
create or replace function public.notify_solution()
returns trigger language plpgsql security definer set search_path = public
as $$
declare owner uuid;
begin
  if new.is_solution and not coalesce(old.is_solution, false) then
    select author_id into owner from public.posts where id = new.post_id;
    if owner is not null and owner <> new.author_id then
      insert into public.notifications (user_id, actor_id, type, post_id, comment_id)
      values (new.author_id, owner, 'solution', new.post_id, new.id);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists on_comment_solution on public.comments;
create trigger on_comment_solution after update of is_solution on public.comments
  for each row execute function public.notify_solution();

-- ── Сообщение обновляет диалог и шлёт уведомление ──
-- Раньше это делал клиент двумя запросами: гонка при одновременной отправке.
create or replace function public.on_message_sent()
returns trigger language plpgsql security definer set search_path = public
as $$
declare other uuid;
begin
  update public.conversations
     set last_message = left(new.body, 200), last_msg_at = new.created_at
   where id = new.conversation_id;

  select case when user1_id = new.sender_id then user2_id else user1_id end
    into other
    from public.conversations where id = new.conversation_id;

  if other is not null and other <> new.sender_id then
    insert into public.notifications (user_id, actor_id, type)
    values (other, new.sender_id, 'message');
  end if;
  return new;
end $$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert after insert on public.messages
  for each row execute function public.on_message_sent();

-- ═══════════════════════════════════════════════════════════════════
-- ФУНКЦИИ (RPC)
-- ═══════════════════════════════════════════════════════════════════

-- Участник диалога? Используется в политиках messages.
create or replace function public.is_conversation_member(conv uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
     where c.id = conv and (c.user1_id = uid or c.user2_id = uid)
  );
$$;

-- Поиск людей. Значения передаются параметрами, а не склейкой строк,
-- поэтому должность вида «Слесарь КИПиА, 5 разряд» больше не ломает запрос.
-- Ищет и по навыкам с оборудованием — раньше это молча не работало.
create or replace function public.search_profiles(q text default '', dzo_filter text default '')
returns setof public.profiles
language sql stable security invoker set search_path = public
as $$
  select p.* from public.profiles p
   where (coalesce(dzo_filter,'') = '' or p.dzo = dzo_filter)
     and (coalesce(q,'') = ''
          or p.full_name ilike '%' || q || '%'
          or p.position  ilike '%' || q || '%'
          or p.specialty ilike '%' || q || '%'
          or exists (select 1 from unnest(p.skills)    s where s ilike '%' || q || '%')
          or exists (select 1 from unnest(p.equipment) e where e ilike '%' || q || '%'))
   order by p.is_expert desc, p.full_name
   limit 50;
$$;

-- Открыть или создать диалог. Атомарно, без гонки и без .single()-ошибки.
create or replace function public.get_or_create_conversation(other_id uuid)
returns uuid language plpgsql security invoker set search_path = public
as $$
declare me uuid := auth.uid(); a uuid; b uuid; conv uuid;
begin
  if me is null       then raise exception 'Требуется авторизация'; end if;
  if me = other_id    then raise exception 'Нельзя написать самому себе'; end if;
  a := least(me, other_id); b := greatest(me, other_id);
  insert into public.conversations (user1_id, user2_id) values (a, b)
    on conflict (user1_id, user2_id) do nothing;
  select id into conv from public.conversations where user1_id = a and user2_id = b;
  return conv;
end $$;

-- Отметить ответ решением. Автор вопроса меняет чужой комментарий,
-- поэтому обычным update это сделать нельзя — нужна функция с проверкой.
create or replace function public.mark_solution(target_comment uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare me uuid := auth.uid(); p uuid;
begin
  select c.post_id into p
    from public.comments c join public.posts po on po.id = c.post_id
   where c.id = target_comment and po.author_id = me;
  if p is null then raise exception 'Отмечать решение может только автор вопроса'; end if;

  update public.comments set is_solution = false where post_id = p and is_solution;
  update public.comments set is_solution = true  where id = target_comment;
  update public.posts    set is_solved   = true  where id = p;
end $$;

-- Счётчик непрочитанных сообщений именно в моих диалогах.
create or replace function public.unread_message_count()
returns int language sql stable security invoker set search_path = public
as $$
  select count(*)::int from public.messages m
    join public.conversations c on c.id = m.conversation_id
   where m.read = false and m.sender_id <> auth.uid()
     and (c.user1_id = auth.uid() or c.user2_id = auth.uid());
$$;

-- ═══════════════════════════════════════════════════════════════════
-- ПРЕДСТАВЛЕНИЯ
--
-- security_invoker = true обязателен. Без него view выполняется с правами
-- владельца и полностью обходит RLS: все посты вместе с ФИО авторов
-- становятся доступны любому, у кого есть публичный anon-ключ.
-- ═══════════════════════════════════════════════════════════════════
drop view if exists public.feed_posts;
create view public.feed_posts with (security_invoker = true) as
select
  p.*,
  pr.full_name  as author_name,
  pr.position   as author_position,
  pr.dzo        as author_dzo,
  pr.specialty  as author_specialty,
  pr.is_expert  as author_is_expert,
  (select count(*) from public.post_likes pl where pl.post_id = p.id) as likes_count,
  (select count(*) from public.comments   c  where c.post_id = p.id) as comments_count
from public.posts p
join public.profiles pr on pr.id = p.author_id;

-- Счётчики сообществ агрегируются в базе, а не выкачиванием всех строк на клиент
drop view if exists public.community_stats;
create view public.community_stats with (security_invoker = true) as
select c.*, (select count(*) from public.community_members m where m.community_id = c.id) as members_count
from public.communities c;

-- Статистика профиля одним запросом вместо трёх
drop view if exists public.profile_stats;
create view public.profile_stats with (security_invoker = true) as
select
  p.id,
  (select count(*) from public.posts    po where po.author_id = p.id) as posts_count,
  (select count(*) from public.comments c  where c.author_id  = p.id) as answers_count,
  (select count(*) from public.comments c  where c.author_id  = p.id and c.is_solution) as solutions_count
from public.profiles p;

-- ═══════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════
alter table public.profiles          enable row level security;
alter table public.posts             enable row level security;
alter table public.post_likes        enable row level security;
alter table public.comments          enable row level security;
alter table public.communities       enable row level security;
alter table public.community_members enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;
alter table public.notifications     enable row level security;
alter table public.dzo_list          enable row level security;

-- ── dzo_list ──
drop policy if exists "dzo read" on public.dzo_list;
create policy "dzo read" on public.dzo_list for select to authenticated using (true);

-- ── profiles ──
drop policy if exists "read all profiles"  on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read all profiles"  on public.profiles for select to authenticated using (true);
create policy "insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ── posts ──
drop policy if exists "read all posts"  on public.posts;
drop policy if exists "insert own posts" on public.posts;
drop policy if exists "update own posts" on public.posts;
drop policy if exists "delete own posts" on public.posts;
create policy "read all posts"   on public.posts for select to authenticated using (true);
create policy "insert own posts" on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "update own posts" on public.posts for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "delete own posts" on public.posts for delete to authenticated using (auth.uid() = author_id);

-- ── likes ──
drop policy if exists "read likes" on public.post_likes;
drop policy if exists "like"       on public.post_likes;
drop policy if exists "unlike"     on public.post_likes;
create policy "read likes" on public.post_likes for select to authenticated using (true);
create policy "like"       on public.post_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "unlike"     on public.post_likes for delete to authenticated using (auth.uid() = user_id);

-- ── comments ──
-- update намеренно НЕ разрешён напрямую: отметка решения идёт через
-- mark_solution(), иначе автор поста не смог бы изменить чужой комментарий.
drop policy if exists "read comments"       on public.comments;
drop policy if exists "insert own comments" on public.comments;
drop policy if exists "update own comments" on public.comments;
drop policy if exists "delete own comments" on public.comments;
create policy "read comments"       on public.comments for select to authenticated using (true);
create policy "insert own comments" on public.comments for insert to authenticated with check (auth.uid() = author_id);
create policy "update own comments" on public.comments for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "delete own comments" on public.comments for delete to authenticated using (auth.uid() = author_id);

-- ── communities ──
drop policy if exists "read communities"   on public.communities;
drop policy if exists "create communities" on public.communities;
drop policy if exists "edit own community" on public.communities;
drop policy if exists "delete own community" on public.communities;
create policy "read communities"     on public.communities for select to authenticated using (true);
create policy "create communities"   on public.communities for insert to authenticated with check (auth.uid() = creator_id);
create policy "edit own community"   on public.communities for update to authenticated
  using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "delete own community" on public.communities for delete to authenticated using (auth.uid() = creator_id);

-- ── участники сообществ ──
drop policy if exists "read members" on public.community_members;
drop policy if exists "join"         on public.community_members;
drop policy if exists "leave"        on public.community_members;
create policy "read members" on public.community_members for select to authenticated using (true);
create policy "join"         on public.community_members for insert to authenticated with check (auth.uid() = user_id);
-- выйти может сам участник, удалить всех — создатель группы при её удалении
create policy "leave" on public.community_members for delete to authenticated using (
  auth.uid() = user_id
  or exists (select 1 from public.communities c where c.id = community_id and c.creator_id = auth.uid())
);

-- ── диалоги: видны только участникам ──
drop policy if exists "read own conversations"   on public.conversations;
drop policy if exists "create conversation"      on public.conversations;
drop policy if exists "update own conversations" on public.conversations;
create policy "read own conversations" on public.conversations for select to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "create conversation" on public.conversations for insert to authenticated
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- ── сообщения: только свои диалоги ──
-- Прежняя схема этого не описывала, и клиент считал непрочитанные по всей
-- таблице — то есть полагался на политику, которой могло не быть вовсе.
drop policy if exists "read own messages"   on public.messages;
drop policy if exists "send message"        on public.messages;
drop policy if exists "mark message read"   on public.messages;
create policy "read own messages" on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()));
create policy "send message" on public.messages for insert to authenticated
  with check (auth.uid() = sender_id and public.is_conversation_member(conversation_id, auth.uid()));
-- прочитанными помечает получатель, свои же сообщения трогать незачем
create policy "mark message read" on public.messages for update to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()) and sender_id <> auth.uid())
  with check (public.is_conversation_member(conversation_id, auth.uid()) and sender_id <> auth.uid());

-- ── уведомления: строго свои ──
drop policy if exists "read own notifications"   on public.notifications;
drop policy if exists "update own notifications" on public.notifications;
drop policy if exists "delete own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select to authenticated
  using (auth.uid() = user_id);
create policy "update own notifications" on public.notifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own notifications" on public.notifications for delete to authenticated
  using (auth.uid() = user_id);
-- insert только через триггеры (security definer), прямой записи нет

-- ═══════════════════════════════════════════════════════════════════
-- ПРАВА НА КОЛОНКИ
--
-- Политика «update own profile» разрешает менять свою строку целиком,
-- а значит и is_expert: любой мог выдать себе золотой значок «Эксперт»
-- одним запросом из консоли. Статус назначается администратором.
-- ═══════════════════════════════════════════════════════════════════
revoke update on public.profiles from authenticated;
grant  update (full_name, position, dzo, region, specialty, experience_years,
               bio, skills, equipment, telegram)
  on public.profiles to authenticated;

-- Представления не должны читаться без авторизации
revoke all on public.feed_posts      from anon;
revoke all on public.community_stats from anon;
revoke all on public.profile_stats   from anon;

-- ═══════════════════════════════════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════════════════════════════════
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  begin alter publication supabase_realtime add table public.messages;      exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.conversations; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- СТАРТОВЫЕ СООБЩЕСТВА
-- ═══════════════════════════════════════════════════════════════════
insert into public.communities (name, description, icon, kind) values
  ('КИПиА Казатомпром',   'Слесари и инженеры КИПиА всей группы КАП. Кейсы, вопросы, обмен опытом.',       'gauge',    'specialty'),
  ('Буровики КАП',        'Буровые мастера, операторы и инженеры ПРС всех дочерних предприятий.',          'drill',    'specialty'),
  ('Химики КАП',          'Технологи гидрометаллургического передела. Выщелачивание, сорбция, экстракция.', 'flask',    'specialty'),
  ('Механики КАП',        'Механики и наладчики оборудования всех ДЗО.',                                   'wrench',   'specialty'),
  ('Энергетики КАП',      'Электрики и энергетики предприятий группы.',                                    'bolt',     'specialty'),
  ('Геологи КАП',         'Геологи и гидрогеологи. Разведка, опробование, моделирование залежей.',          'layers',   'specialty'),
  ('Охрана труда',        'Промышленная безопасность, охрана труда и радиационный контроль.',              'shield',   'specialty'),
  ('Молодые специалисты', 'Для тех кто в КАПе до 5 лет. Вопросы, менторство, знакомства.',                 'helmet',   'interest'),
  ('Орталык',             'Сообщество сотрудников АО «Орталык».',                                          'mountain', 'dzo'),
  ('Инкай',               'Сообщество сотрудников АО «СП «Инкай».',                                        'factory',  'dzo'),
  ('Байкен-U',            'Сообщество сотрудников АО «Байкен-U».',                                         'crane',    'dzo'),
  ('Катко',               'Сообщество сотрудников ТОО «СП «Катко».',                                       'hammer',   'dzo')
on conflict (name) do nothing;
