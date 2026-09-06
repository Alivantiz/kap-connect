// Демонстрационный слой данных: та же сигнатура, что у src/lib/db.js,
// но всё хранится в памяти. Приложение при этом настоящее — экраны,
// состояния и обработка ошибок не менялись.

import * as seed from './data'

const db = {
  profiles: seed.profiles.map((p) => ({ ...p })),
  posts: seed.posts.map((p) => ({ ...p })),
  comments: seed.comments.map((c) => ({ ...c })),
  likes: new Set(seed.likes),
  communities: seed.communities.map((c) => ({ ...c })),
  myCommunities: new Set(seed.myCommunities),
  conversations: seed.conversations.map((c) => ({ ...c })),
  messages: seed.messages.map((m) => ({ ...m })),
  notifications: seed.notifications.map((n) => ({ ...n })),
}

const ME = seed.ME
const ok = (data) => Promise.resolve({ data, error: null })
const id = (p) => `${p}-${Math.random().toString(36).slice(2, 9)}`
const person = (uid) => db.profiles.find((p) => p.id === uid) || null
const now = () => new Date().toISOString()

// Небольшая задержка: без неё скелетоны и состояния загрузки не видны.
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms))
const slow = async (data) => {
  await wait()
  return { data, error: null }
}

export const humanError = (e) => (e ? e.message || String(e) : null)

let onAuth = null
export const auth = {
  getSession: () => Promise.resolve({ data: { session: { user: { id: ME } } } }),
  onAuthStateChange: (cb) => {
    onAuth = cb
    return { data: { subscription: { unsubscribe: () => {} } } }
  },
  signOut: () => {
    // В демонстрации выход возвращает на экран входа, а вход принимает любые данные.
    onAuth?.('SIGNED_OUT', null)
    return Promise.resolve({})
  },
  signIn: async () => {
    await wait(500)
    onAuth?.('SIGNED_IN', { user: { id: ME } })
    return ok({ session: {} })
  },
  signUp: async () => {
    await wait(600)
    onAuth?.('SIGNED_IN', { user: { id: ME } })
    return ok({ session: {} })
  },
  resetPassword: async () => {
    await wait(400)
    return ok({})
  },
}

export const listDzo = () => slow(seed.dzoList)

export const getProfile = (uid) => slow(person(uid))

export const getProfileStats = (uid) =>
  slow({
    id: uid,
    posts_count: db.posts.filter((p) => p.author_id === uid).length,
    answers_count: db.comments.filter((c) => c.author_id === uid).length,
    solutions_count: db.comments.filter((c) => c.author_id === uid && c.is_solution).length,
  })

export const updateProfile = async (uid, patch) => {
  await wait(400)
  const p = person(uid)
  Object.assign(p, patch)
  return ok({ ...p })
}

const matches = (p, q) => {
  const s = q.toLowerCase()
  return (
    p.full_name.toLowerCase().includes(s) ||
    (p.position || '').toLowerCase().includes(s) ||
    (p.specialty || '').toLowerCase().includes(s) ||
    (p.skills || []).some((x) => x.toLowerCase().includes(s)) ||
    (p.equipment || []).some((x) => x.toLowerCase().includes(s))
  )
}

export const searchProfiles = (q, dzo) =>
  slow(
    db.profiles
      .filter((p) => (!dzo || p.dzo === dzo) && (!q || matches(p, q)))
      .sort((a, b) => Number(b.is_expert) - Number(a.is_expert) || a.full_name.localeCompare(b.full_name)),
  )

export const searchPeopleByName = (q, except) =>
  slow(
    db.profiles.filter((p) => p.id !== except && p.full_name.toLowerCase().includes(q.toLowerCase())),
  )

const withAuthor = (p) => {
  const a = person(p.author_id) || {}
  return {
    ...p,
    author_name: a.full_name,
    author_position: a.position,
    author_dzo: a.dzo,
    author_specialty: a.specialty,
    author_is_expert: a.is_expert,
    likes_count: p.likes_count,
    comments_count: db.comments.filter((c) => c.post_id === p.id).length,
  }
}

export async function listFeed({ filter, me, limit = 40, before = null }) {
  await wait()
  let rows = db.posts.map(withAuthor)
  if (filter === 'dzo') rows = rows.filter((p) => p.author_dzo === me?.dzo)
  if (filter === 'specialty') rows = rows.filter((p) => p.author_specialty === (me?.specialty || me?.position))
  if (filter === 'questions') rows = rows.filter((p) => p.type === 'question')
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  if (before) rows = rows.filter((p) => p.created_at < before)
  return ok(rows.slice(0, limit))
}

export const myLikedPostIds = () => ok(new Set(db.likes))

export const createPost = async (post) => {
  await wait(400)
  const row = { ...post, id: id('p'), is_solved: false, likes_count: 0, created_at: now() }
  db.posts.unshift(row)
  return ok(row)
}

export const deletePost = async (postId) => {
  await wait(300)
  db.posts = db.posts.filter((p) => p.id !== postId)
  return ok([{ id: postId }])
}

export const likePost = async (postId) => {
  await wait(150)
  db.likes.add(postId)
  const p = db.posts.find((x) => x.id === postId)
  if (p) p.likes_count += 1
  return ok(null)
}

export const unlikePost = async (postId) => {
  await wait(150)
  db.likes.delete(postId)
  const p = db.posts.find((x) => x.id === postId)
  if (p) p.likes_count = Math.max(0, p.likes_count - 1)
  return ok(null)
}

export const listComments = (postId) =>
  slow(
    db.comments
      .filter((c) => c.post_id === postId)
      .map((c) => ({ ...c, profiles: person(c.author_id) })),
  )

export const addComment = async (postId, authorId, body) => {
  await wait(350)
  const row = { id: id('c'), post_id: postId, author_id: authorId, body, is_solution: false, created_at: now() }
  db.comments.push(row)
  return ok(row)
}

export const deleteComment = async (commentId) => {
  await wait(250)
  db.comments = db.comments.filter((c) => c.id !== commentId)
  return ok([{ id: commentId }])
}

export const markSolution = async (commentId) => {
  await wait(300)
  const target = db.comments.find((c) => c.id === commentId)
  if (!target) return ok(null)
  db.comments.forEach((c) => {
    if (c.post_id === target.post_id) c.is_solution = false
  })
  target.is_solution = true
  const post = db.posts.find((p) => p.id === target.post_id)
  if (post) post.is_solved = true
  return ok(null)
}

export const listCommunities = (kind) =>
  slow(db.communities.filter((c) => !kind || kind === 'all' || c.kind === kind))

export const myCommunityIds = () => ok(new Set(db.myCommunities))

export const joinCommunity = async (cid) => {
  await wait(200)
  db.myCommunities.add(cid)
  const c = db.communities.find((x) => x.id === cid)
  if (c) c.members_count += 1
  return ok(null)
}

export const leaveCommunity = async (cid) => {
  await wait(200)
  db.myCommunities.delete(cid)
  const c = db.communities.find((x) => x.id === cid)
  if (c) c.members_count = Math.max(0, c.members_count - 1)
  return ok([{ community_id: cid }])
}

export const createCommunity = async (payload) => {
  await wait(400)
  const row = { ...payload, id: id('g'), members_count: 0 }
  db.communities.unshift(row)
  return ok(row)
}

export const updateCommunity = async (cid, patch) => {
  await wait(350)
  const c = db.communities.find((x) => x.id === cid)
  Object.assign(c, patch)
  return ok({ ...c })
}

export const deleteCommunity = async (cid) => {
  await wait(300)
  db.communities = db.communities.filter((c) => c.id !== cid)
  db.myCommunities.delete(cid)
  return ok([{ id: cid }])
}

export const listConversations = () =>
  slow(
    [...db.conversations]
      .sort((a, b) => b.last_msg_at.localeCompare(a.last_msg_at))
      .map((c) => ({ ...c, p1: person(c.user1_id), p2: person(c.user2_id) })),
  )

export const openConversation = async (other) => {
  await wait(300)
  let c = db.conversations.find((x) => x.user1_id === other || x.user2_id === other)
  if (!c) {
    c = { id: id('k'), user1_id: ME, user2_id: other, last_message: null, last_msg_at: now() }
    db.conversations.push(c)
  }
  return ok(c.id)
}

export const listMessages = (convId) =>
  slow(db.messages.filter((m) => m.conversation_id === convId))

let onMessage = null
export const sendMessage = async (convId, senderId, body) => {
  await wait(250)
  const row = { id: id('m'), conversation_id: convId, sender_id: senderId, body, read: true, created_at: now() }
  db.messages.push(row)
  const c = db.conversations.find((x) => x.id === convId)
  if (c) {
    c.last_message = body
    c.last_msg_at = row.created_at
  }
  // Демонстрационный ответ собеседника, чтобы был виден живой обмен
  const other = c && (c.user1_id === senderId ? c.user2_id : c.user1_id)
  if (other) {
    setTimeout(() => {
      const reply = {
        id: id('m'),
        conversation_id: convId,
        sender_id: other,
        body: 'Принято, посмотрю и отвечу подробнее.',
        read: false,
        created_at: now(),
      }
      db.messages.push(reply)
      if (c) {
        c.last_message = reply.body
        c.last_msg_at = reply.created_at
      }
      onMessage?.(reply)
    }, 1600)
  }
  return ok(row)
}

export const markMessagesRead = async (convId) => {
  db.messages.forEach((m) => {
    if (m.conversation_id === convId && m.sender_id !== ME) m.read = true
  })
  return ok(null)
}

export const unreadMessageCount = () =>
  ok(db.messages.filter((m) => !m.read && m.sender_id !== ME).length)

export const listNotifications = () =>
  slow(
    [...db.notifications]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((n) => ({
        ...n,
        actor: person(n.actor_id),
        post: db.posts.find((p) => p.id === n.post_id) || null,
      })),
  )

export const countUnreadNotifications = () => ok(db.notifications.filter((n) => !n.read).length)

export const markNotificationsRead = async () => {
  db.notifications.forEach((n) => {
    n.read = true
  })
  return ok(null)
}

export function subscribeToMessages(convId, cb) {
  onMessage = (row) => row.conversation_id === convId && cb(row)
  return () => {
    onMessage = null
  }
}

export const subscribeToMyConversations = () => () => {}
export const subscribeToMyNotifications = () => () => {}
