-- ═══════════════════════════════════════════════════════
-- KAP Connect — схема БД для пилота
-- Выполнить в Supabase: SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════

-- ── Профили ──
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  position text,                     -- должность
  dzo text,                          -- ДЗО (Орталык, Инкай...)
  region text,                       -- регион
  specialty text,                    -- специальность (КИПиА, буровик...)
  experience_years int default 0,
  bio text,
  skills text[] default '{}',        -- навыки
  equipment text[] default '{}',     -- оборудование
  telegram text,
  is_expert boolean default false,
  created_at timestamptz default now()
);

-- ── Посты ──
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('post','case','question')),
  title text not null,
  body text,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- ── Лайки ──
create table public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- ── Комментарии ──
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  is_solution boolean default false,  -- отмечен как решение
  created_at timestamptz default now()
);

-- ── Сообщества ──
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  emoji text default '⚙️',
  kind text not null check (kind in ('specialty','dzo')),
  is_closed boolean default false,
  created_at timestamptz default now()
);

-- ── Участники сообществ ──
create table public.community_members (
  community_id uuid references public.communities(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (community_id, user_id)
);

-- ═══════════════════════════════════════════════════════
-- ИНДЕКСЫ
-- ═══════════════════════════════════════════════════════
create index idx_posts_created on public.posts (created_at desc);
create index idx_posts_author on public.posts (author_id);
create index idx_posts_tags on public.posts using gin (tags);
create index idx_profiles_skills on public.profiles using gin (skills);
create index idx_profiles_dzo on public.profiles (dzo);
create index idx_comments_post on public.comments (post_id);

-- ═══════════════════════════════════════════════════════
-- RLS — Row Level Security
-- Пилот: все авторизованные читают всё, пишут только своё
-- ═══════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;

-- profiles
create policy "read all profiles" on public.profiles
  for select to authenticated using (true);
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- posts
create policy "read all posts" on public.posts
  for select to authenticated using (true);
create policy "insert own posts" on public.posts
  for insert to authenticated with check (auth.uid() = author_id);
create policy "update own posts" on public.posts
  for update to authenticated using (auth.uid() = author_id);
create policy "delete own posts" on public.posts
  for delete to authenticated using (auth.uid() = author_id);

-- likes
create policy "read likes" on public.post_likes
  for select to authenticated using (true);
create policy "like" on public.post_likes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "unlike" on public.post_likes
  for delete to authenticated using (auth.uid() = user_id);

-- comments
create policy "read comments" on public.comments
  for select to authenticated using (true);
create policy "insert own comments" on public.comments
  for insert to authenticated with check (auth.uid() = author_id);
create policy "delete own comments" on public.comments
  for delete to authenticated using (auth.uid() = author_id);

-- communities
create policy "read communities" on public.communities
  for select to authenticated using (true);

-- community members
create policy "read members" on public.community_members
  for select to authenticated using (true);
create policy "join" on public.community_members
  for insert to authenticated with check (auth.uid() = user_id);
create policy "leave" on public.community_members
  for delete to authenticated using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- СТАРТОВЫЕ СООБЩЕСТВА
-- ═══════════════════════════════════════════════════════
insert into public.communities (name, description, emoji, kind) values
  ('КИПиА Казатомпром', 'Слесари и инженеры КИПиА всей группы КАП. Кейсы, вопросы, обмен опытом.', '⚙️', 'specialty'),
  ('Буровики КАП', 'Буровые мастера, операторы и инженеры ПРС всех дочерних предприятий.', '⛏️', 'specialty'),
  ('Химики КАП', 'Технологи гидрометаллургического передела. Выщелачивание, сорбция, экстракция.', '🔬', 'specialty'),
  ('Механики КАП', 'Механики и наладчики оборудования всех ДЗО.', '🔧', 'specialty'),
  ('Энергетики КАП', 'Электрики и энергетики предприятий группы.', '⚡', 'specialty'),
  ('Молодые специалисты', 'Для тех кто в КАПе до 5 лет. Вопросы, менторство, знакомства.', '👷', 'specialty'),
  ('Орталык', 'Сообщество сотрудников АО «Орталык».', '🏔️', 'dzo'),
  ('Инкай', 'Сообщество сотрудников АО «Инкай».', '🏭', 'dzo'),
  ('Байкен-У', 'Сообщество сотрудников АО «Байкен-U».', '🏗️', 'dzo'),
  ('Катко', 'Сообщество сотрудников АО «Катко».', '⚒️', 'dzo');

-- ═══════════════════════════════════════════════════════
-- VIEW: посты со счётчиками и автором (для ленты)
-- ═══════════════════════════════════════════════════════
create or replace view public.feed_posts as
select
  p.*,
  pr.full_name as author_name,
  pr.position as author_position,
  pr.dzo as author_dzo,
  pr.specialty as author_specialty,
  (select count(*) from public.post_likes pl where pl.post_id = p.id) as likes_count,
  (select count(*) from public.comments c where c.post_id = p.id) as comments_count
from public.posts p
join public.profiles pr on pr.id = p.author_id;
