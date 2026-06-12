# KAP Connect — пилотный проект

Профессиональная социальная сеть для сотрудников АО «НАК «Казатомпром».
Профили специалистов · Лента (посты, кейсы, вопросы) · Поиск экспертов · Сообщества.

**Стек:** React + Vite · Supabase (Auth + Postgres + RLS) · Vercel

---

## Запуск за 15 минут

### 1. Supabase

1. Зайди на [supabase.com](https://supabase.com) → New project
2. Назови `kap-connect`, выбери регион (Frankfurt ближе всего к КЗ)
3. Открой **SQL Editor** → New query → вставь содержимое `supabase/schema.sql` → **Run**
4. Открой **Authentication → Providers → Email** — убедись что включён
5. **Authentication → Settings**: отключи "Confirm email" для пилота (иначе нужен SMTP)
6. Скопируй из **Settings → API**:
   - `Project URL`
   - `anon public` ключ

### 2. Локальный запуск

```bash
git clone https://github.com/Alivantiz/kap-connect.git
cd kap-connect
npm install

# создай .env
cp .env.example .env
# впиши свои ключи в .env

npm run dev
```

### 3. GitHub

```bash
git init
git add .
git commit -m "KAP Connect MVP"
git remote add origin https://github.com/Alivantiz/kap-connect.git
git push -u origin main
```

### 4. Vercel

1. [vercel.com](https://vercel.com) → Add New → Project → импортируй репо `kap-connect`
2. Framework: Vite (определится сам)
3. **Environment Variables** — добавь:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon ключ
4. Deploy

Готово — у тебя боевой URL вида `kap-connect.vercel.app`.

---

## Структура

```
src/
  components/
    Icons.jsx      — кастомный набор иконок (гексагональный стиль)
    NewPost.jsx    — модалка создания публикации
  screens/
    Auth.jsx       — вход / регистрация (email + пароль)
    Feed.jsx       — лента с фильтрами, лайки, комментарии
    Search.jsx     — поиск экспертов по навыку/ДЗО/оборудованию
    Communities.jsx— сообщества по специальности и ДЗО
    Profile.jsx    — профиль + редактирование
  lib/
    supabase.js    — клиент
supabase/
  schema.sql       — таблицы, RLS, стартовые сообщества
```

## База данных

| Таблица | Что хранит |
|---|---|
| `profiles` | ФИО, должность, ДЗО, регион, специальность, навыки, оборудование, Telegram |
| `posts` | публикации: post / case / question, теги |
| `post_likes` | лайки |
| `comments` | ответы (с флагом is_solution) |
| `communities` | сообщества по специальности и ДЗО |
| `community_members` | участники |

RLS: все авторизованные читают всё, пишут/правят только своё.

## Что дальше (после пилота)

- [ ] Реакция «Решено» — автор вопроса отмечает лучший ответ
- [ ] Лента сообщества (посты внутри группы)
- [ ] Push-уведомления (OneSignal / FCM)
- [ ] Рейтинг экспертов по активности
- [ ] Фото в постах (Supabase Storage)
- [ ] PWA-манифест для установки на домашний экран
- [ ] Интеграция с AD КАПа (SSO) — на этапе масштабирования
