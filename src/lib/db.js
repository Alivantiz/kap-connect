// Слой доступа к данным.
//
// Зачем он нужен:
//  1. Раньше ошибки Supabase почти нигде не проверялись — лайк, комментарий
//     или отправка сообщения могли молча провалиться, а UI показывал успех.
//     Здесь каждый вызов возвращает { data, error } с понятным текстом.
//  2. Пользовательский ввод больше не склеивается в строки фильтров PostgREST.
//     Поиск и открытие диалога ушли в RPC с параметрами.
//  3. Компоненты становятся тестируемыми: в тестах подменяется этот модуль,
//     а не цепочка методов клиента Supabase.

import { supabase } from './supabase'

const MESSAGES = {
  'Invalid login credentials': 'Неверный email или пароль',
  'Email not confirmed': 'Email не подтверждён. Проверьте почту.',
  'User already registered': 'Этот email уже зарегистрирован',
  'Password should be at least 6 characters': 'Пароль минимум 6 символов',
  'For security purposes, you can only request this after 60 seconds':
    'Слишком часто. Попробуйте через минуту.',
}

/** Приводит ошибку Supabase к строке, понятной пользователю. */
export function humanError(error) {
  if (!error) return null
  const raw = error.message || String(error)
  if (MESSAGES[raw]) return MESSAGES[raw]
  if (error.code === '23505') return 'Такая запись уже существует'
  if (error.code === '23514') return 'Данные не прошли проверку'
  if (error.code === '42501' || raw.includes('row-level security'))
    return 'Недостаточно прав для этого действия'
  if (error.code === '42703' || error.code === '42883')
    return 'База данных устарела. Выполните supabase/schema.sql заново.'
  if (error.code === 'PGRST116') return 'Запись не найдена или недоступна'
  if (error.code === 'PGRST202') return 'Функция не найдена в базе. Обновите схему.'
  if (error.code === 'PGRST301') return 'Сессия истекла. Войдите заново.'
  if (error.code === 'PGRST100') return 'Некорректный запрос к серверу'
  if (raw.includes('Failed to fetch') || raw.includes('NetworkError'))
    return 'Нет связи с сервером. Проверьте интернет.'
  return raw
}

const ok = (data) => ({ data, error: null })
const fail = (error) => ({ data: null, error: humanError(error) })

/**
 * Запись, которая обязана затронуть хотя бы одну строку.
 * PostgREST отвечает 204 без ошибки, когда политика RLS отсеяла все
 * кандидаты, — прежде такое удаление выглядело как успешное, и карточка
 * пропадала из списка, оставаясь в базе.
 */
async function mustAffect(promise) {
  const r = await run(promise, [])
  if (r.error) return r
  return r.data?.length ? ok(r.data) : fail({ code: '42501' })
}

/** Оборачивает промис запроса: нормализует форму ответа и ловит сетевые сбои. */
async function run(promise, fallback = null) {
  try {
    const { data, error } = await promise
    if (error) return fail(error)
    return ok(data ?? fallback)
  } catch (e) {
    return fail(e)
  }
}

// ─────────────────────────────── auth ───────────────────────────────

export const auth = {
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),
  signOut: () => supabase.auth.signOut(),

  async signIn(email, password) {
    return run(supabase.auth.signInWithPassword({ email: email.trim(), password }))
  },

  async signUp({ email, password, full_name, dzo, specialty }) {
    return run(
      supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name, dzo, specialty } },
      }),
    )
  },

  async resetPassword(email) {
    return run(
      supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      }),
    )
  },
}

// ────────────────────────────── справочник ──────────────────────────

export async function listDzo() {
  const r = await run(supabase.from('dzo_list').select('name').order('sort'), [])
  return r.error ? r : ok((r.data || []).map((d) => d.name))
}

// ─────────────────────────────── профили ────────────────────────────

export const getProfile = (id) =>
  run(supabase.from('profiles').select('*').eq('id', id).maybeSingle())

export const getProfileStats = (id) =>
  run(supabase.from('profile_stats').select('*').eq('id', id).maybeSingle())

export const updateProfile = (id, patch) =>
  run(supabase.from('profiles').update(patch).eq('id', id).select().single())

/**
 * Поиск людей через RPC.
 * Прежняя версия склеивала запрос в .or(...) — должность с запятой
 * («Слесарь КИПиА, 5 разряд») ломала фильтр целиком. И она не искала
 * по навыкам с оборудованием, хотя плейсхолдер это обещал.
 */
export const searchProfiles = (query, dzoFilter) =>
  run(
    supabase.rpc('search_profiles', {
      q: (query || '').trim(),
      dzo_filter: dzoFilter || '',
    }),
    [],
  )

export const searchPeopleByName = (query, exceptId) =>
  run(
    supabase
      .from('profiles')
      .select('id,full_name,position,dzo')
      .ilike('full_name', `%${String(query || '').replace(/[%_]/g, '\\$&')}%`)
      .neq('id', exceptId)
      .order('full_name')
      .limit(20),
    [],
  )

// ──────────────────────────────── лента ─────────────────────────────

export async function listFeed({ filter, me, limit = 40, before = null }) {
  let q = supabase.from('feed_posts').select('*').order('created_at', { ascending: false })

  // Значения подставляются через .eq/.in — экранирование делает клиент,
  // поэтому запятые и кавычки в названии ДЗО больше не ломают запрос.
  if (filter === 'dzo' && me?.dzo) q = q.eq('author_dzo', me.dzo)
  if (filter === 'specialty') {
    const spec = me?.specialty || me?.position
    if (!spec) return ok([])
    // .eq(), а не .in(): postgrest-js не экранирует кавычки внутри значения,
    // и должность вида «Слесарь КИПиА, "5 разряд"» давала битый фильтр.
    q = q.eq('author_specialty', spec)
  }
  if (filter === 'questions') q = q.eq('type', 'question')
  if (filter === 'cases') q = q.eq('type', 'case')
  if (before) q = q.lt('created_at', before)

  return run(q.limit(limit), [])
}

export const myLikedPostIds = async (userId) => {
  const r = await run(supabase.from('post_likes').select('post_id').eq('user_id', userId), [])
  return r.error ? r : ok(new Set((r.data || []).map((l) => l.post_id)))
}

export const createPost = ({ author_id, type, title, body, tags }) =>
  run(
    supabase
      .from('posts')
      .insert({ author_id, type, title, body: body || null, tags })
      .select()
      .single(),
  )

export const deletePost = (id) =>
  mustAffect(supabase.from('posts').delete().eq('id', id).select('id'))

export const likePost = (postId, userId) =>
  run(supabase.from('post_likes').insert({ post_id: postId, user_id: userId }))

export const unlikePost = (postId, userId) =>
  run(supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId))

// ─────────────────────────────── ответы ─────────────────────────────

export const listComments = (postId) =>
  run(
    supabase
      .from('comments')
      .select('*, profiles!comments_author_id_fkey(id,full_name,dzo,specialty,position,is_expert)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
    [],
  )

export const addComment = (postId, authorId, body) =>
  run(
    supabase
      .from('comments')
      .insert({ post_id: postId, author_id: authorId, body })
      .select()
      .single(),
  )

export const deleteComment = (id) =>
  mustAffect(supabase.from('comments').delete().eq('id', id).select('id'))

/**
 * Отметить ответ решением.
 * Автор вопроса меняет ЧУЖОЙ комментарий, поэтому прямой update отклоняется
 * политикой RLS — раньше оба запроса молча проваливались. Теперь это RPC,
 * которая сама проверяет, что вызывающий действительно автор вопроса.
 */
export const markSolution = (commentId) =>
  run(supabase.rpc('mark_solution', { target_comment: commentId }))

// ───────────────────────────── сообщества ───────────────────────────

export async function listCommunities(kind) {
  let q = supabase.from('community_stats').select('*').order('members_count', { ascending: false })
  if (kind && kind !== 'all') q = q.eq('kind', kind)
  return run(q, [])
}

export const myCommunityIds = async (userId) => {
  const r = await run(
    supabase.from('community_members').select('community_id').eq('user_id', userId),
    [],
  )
  return r.error ? r : ok(new Set((r.data || []).map((m) => m.community_id)))
}

export const joinCommunity = (communityId, userId) =>
  run(supabase.from('community_members').insert({ community_id: communityId, user_id: userId }))

export const leaveCommunity = (communityId, userId) =>
  mustAffect(
    supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .select('community_id'),
  )

export const createCommunity = (payload) =>
  run(supabase.from('communities').insert(payload).select().single())

export const updateCommunity = (id, patch) =>
  run(supabase.from('communities').update(patch).eq('id', id).select().single())

/** Участники удалятся каскадом по внешнему ключу — отдельный запрос не нужен. */
export const deleteCommunity = (id) =>
  mustAffect(supabase.from('communities').delete().eq('id', id).select('id'))

// ────────────────────────────── сообщения ───────────────────────────

export const listConversations = (myId) =>
  run(
    supabase
      .from('conversations')
      .select(
        `*,
         p1:profiles!conversations_user1_id_fkey(id,full_name,position,dzo,is_expert),
         p2:profiles!conversations_user2_id_fkey(id,full_name,position,dzo,is_expert)`,
      )
      .or(`user1_id.eq.${myId},user2_id.eq.${myId}`)
      .order('last_msg_at', { ascending: false }),
    [],
  )

/**
 * Открыть диалог с человеком.
 * Раньше клиент сам сортировал пару и делал .single(), который падает,
 * если строки нет. Теперь одна атомарная RPC без гонки.
 */
export const openConversation = (otherId) =>
  run(supabase.rpc('get_or_create_conversation', { other_id: otherId }))

export const listMessages = (convId) =>
  run(
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true }),
    [],
  )

/** last_message и last_msg_at обновляет триггер в базе, а не клиент. */
export const sendMessage = (convId, senderId, body) =>
  run(
    supabase
      .from('messages')
      .insert({ conversation_id: convId, sender_id: senderId, body })
      .select()
      .single(),
  )

export const markMessagesRead = (convId, myId) =>
  run(
    supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', convId)
      .eq('read', false)
      .neq('sender_id', myId),
  )

/** Считает только мои диалоги — прежний запрос шёл по всей таблице. */
export const unreadMessageCount = async () => {
  const r = await run(supabase.rpc('unread_message_count'), 0)
  return r.error ? r : ok(r.data || 0)
}

// ───────────────────────────── уведомления ──────────────────────────

export const listNotifications = (myId) =>
  run(
    supabase
      .from('notifications')
      .select(
        `*,
         actor:profiles!notifications_actor_id_fkey(id,full_name,position,dzo),
         post:posts(id,title,type)`,
      )
      .eq('user_id', myId)
      .order('created_at', { ascending: false })
      .limit(50),
    [],
  )

export const countUnreadNotifications = async (myId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', myId)
      .eq('read', false)
    if (error) return fail(error)
    return ok(count || 0)
  } catch (e) {
    return fail(e)
  }
}

export const markNotificationsRead = (myId) =>
  run(supabase.from('notifications').update({ read: true }).eq('user_id', myId).eq('read', false))

// ─────────────────────────────── realtime ───────────────────────────

/**
 * Подписка на новые сообщения в конкретном диалоге.
 * Прежний код слушал ВСЕ изменения таблицы conversations, поэтому чужая
 * переписка дёргала перезагрузку у каждого пользователя.
 */
export function subscribeToMessages(convId, onInsert) {
  const channel = supabase
    .channel(`messages:${convId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      },
      (payload) => onInsert(payload.new),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

/**
 * Обновление списка диалогов.
 * Прежняя версия слушала всю таблицу без фильтра, поэтому чужая переписка
 * дёргала перезагрузку у каждого. Здесь два канала строго по своим строкам:
 * PostgREST допускает только одно условие на подписку.
 */
export function subscribeToMyConversations(myId, onChange) {
  const channels = ['user1_id', 'user2_id'].map((col) =>
    supabase
      .channel(`conversations:${col}:${myId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `${col}=eq.${myId}` },
        onChange,
      )
      .subscribe(),
  )
  return () => channels.forEach((c) => supabase.removeChannel(c))
}

export function subscribeToMyNotifications(myId, onInsert) {
  const channel = supabase
    .channel(`notifications:${myId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${myId}` },
      (payload) => onInsert(payload.new),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}
