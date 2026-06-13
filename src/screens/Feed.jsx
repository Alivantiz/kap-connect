import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { IconHeart, IconComment, IconCase, IconQuestion, IconClose, IconSend, IconCheck } from '../components/Icons'

const AVA_COLORS = ['#3A6BA8', '#2E7D52', '#8B5E1A', '#5B3EA6', '#7A3030', '#1A6B6B', '#4A6B1A', '#6B1A5B']
const avaColor = (name) => AVA_COLORS[(name?.charCodeAt(0) || 0) % AVA_COLORS.length]
const initials = (name) => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'сейчас'
  if (s < 3600) return Math.floor(s / 60) + 'м'
  if (s < 86400) return Math.floor(s / 3600) + 'ч'
  if (s < 604800) return Math.floor(s / 86400) + 'д'
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'short' })
}

const TYPE_BADGE = {
  case:     { cls: 'badge-case',     label: 'Кейс',   Icon: IconCase },
  question: { cls: 'badge-question', label: 'Вопрос', Icon: IconQuestion },
  post:     { cls: 'badge-post',     label: 'Пост',   Icon: null },
}

export default function Feed({ myId, onOpenProfile }) {
  const [filter, setFilter] = useState('all')
  const [posts, setPosts] = useState(null)
  const [myLikes, setMyLikes] = useState(new Set())
  const [me, setMe] = useState(null)
  const [openComments, setOpenComments] = useState(null)

  useEffect(() => {
    supabase.from('profiles').select('dzo, specialty, full_name').eq('id', myId).single()
      .then(({ data }) => setMe(data))
  }, [myId])

  // Лаконичное название ДЗО для таба (убираем АО, ТОО, «»)
  const dzoShort = me?.dzo
    ? me.dzo.replace(/^(АО|ТОО|СП|ДП)\s*/i, '').replace(/[«»""]/g, '').replace(/^СП\s*/i, '').trim().split(' ')[0]
    : 'Моё ДЗО'
  const specialtyShort = me?.specialty
    ? (me.specialty.length > 12 ? me.specialty.slice(0, 12) + '…' : me.specialty)
    : 'Специальность'

  const load = useCallback(async () => {
    let q = supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(60)
    if (filter === 'dzo' && me?.dzo) q = q.eq('author_dzo', me.dzo)
    if (filter === 'specialty' && me?.specialty) q = q.eq('author_specialty', me.specialty)
    const { data } = await q
    setPosts(data || [])
    const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', myId)
    setMyLikes(new Set((likes || []).map(l => l.post_id)))
  }, [filter, me, myId])

  useEffect(() => { load() }, [load])

  const toggleLike = async (post) => {
    const liked = myLikes.has(post.id)
    const next = new Set(myLikes)
    liked ? next.delete(post.id) : next.add(post.id)
    setMyLikes(next)
    setPosts(ps => ps.map(p => p.id === post.id
      ? { ...p, likes_count: Number(p.likes_count) + (liked ? -1 : 1) } : p))
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', myId)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: myId })
    }
  }

  return (
    <>
      <div className="tabs">
        <button className={`tab ${filter==='all'?'active':''}`} onClick={() => setFilter('all')}>Все КАП</button>
        <button className={`tab ${filter==='dzo'?'active':''}`} onClick={() => setFilter('dzo')}>{dzoShort}</button>
        <button className={`tab ${filter==='specialty'?'active':''}`} onClick={() => setFilter('specialty')}>{specialtyShort}</button>
      </div>

      {posts === null && <div className="spinner" />}

      {posts?.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <div className="empty-title">Пока пусто</div>
          <div className="empty-sub">
            {filter === 'dzo' && me?.dzo
              ? `В ${dzoShort} ещё нет публикаций. Будьте первым.`
              : filter === 'specialty' && me?.specialty
              ? `По специальности «${me.specialty}» ещё нет публикаций.`
              : 'Поделитесь кейсом или задайте вопрос — коллеги из всех ДЗО увидят.'}
          </div>
        </div>
      )}

      {posts?.map(p => {
        const badge = TYPE_BADGE[p.type] || TYPE_BADGE.post
        const liked = myLikes.has(p.id)
        const isMyPost = p.author_id === myId
        return (
          <article className="post" key={p.id}>
            <div className="post-head">
              <div className="ava" style={{ background: avaColor(p.author_name) }}
                   onClick={() => onOpenProfile(p.author_id)}>
                {initials(p.author_name)}
              </div>
              <div className="post-head-info">
                <div className="post-top">
                  <span className="post-name" onClick={() => onOpenProfile(p.author_id)}>
                    {p.author_name}
                  </span>
                  <span className="post-time">{timeAgo(p.created_at)}</span>
                </div>
                <div className="post-where">
                  {[p.author_dzo?.replace(/^(АО|ТОО)\s*[«"]?/i,'').replace(/[»"]/g,'').trim(),
                    p.author_position || p.author_specialty
                  ].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>

            <div className="post-body">
              <div className="post-type-row">
                <span className={`badge ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <div className="post-title">{p.title}</div>
              {p.body && <div className="post-text">{p.body}</div>}
              {p.tags?.length > 0 && (
                <div className="tags">
                  {p.tags.map(t => <span className="tag-chip" key={t}>#{t}</span>)}
                </div>
              )}
            </div>

            <div className="post-footer">
              <button className={`action ${liked?'liked':''}`} onClick={() => toggleLike(p)}>
                <IconHeart size={17} active={liked} />
                {p.likes_count > 0 && <span>{p.likes_count}</span>}
              </button>
              <button className="action" onClick={() => setOpenComments(p)}>
                <IconComment size={17} />
                <span>{p.comments_count > 0 ? p.comments_count : 'Ответить'}</span>
              </button>
            </div>
          </article>
        )
      })}

      {openComments && (
        <CommentsModal
          post={openComments}
          myId={myId}
          onClose={() => { setOpenComments(null); load() }}
          onOpenProfile={onOpenProfile}
        />
      )}
    </>
  )
}

function CommentsModal({ post, myId, onClose, onOpenProfile }) {
  const [comments, setComments] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles!comments_author_id_fkey(full_name, dzo, specialty)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }, [post.id])

  useEffect(() => { load() }, [load])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    await supabase.from('comments').insert({ post_id: post.id, author_id: myId, body: text.trim() })
    setText('')
    setSending(false)
    load()
  }

  const markSolution = async (commentId) => {
    // снимаем предыдущее решение
    await supabase.from('comments').update({ is_solution: false }).eq('post_id', post.id)
    await supabase.from('comments').update({ is_solution: true }).eq('id', commentId)
    load()
  }

  const isMyPost = post.author_id === myId

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal comments-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-text">Ответы</div>
          <button className="icon-btn" onClick={onClose}><IconClose size={18} /></button>
        </div>

        <div className="comments-post-preview">
          <span className={`badge ${(TYPE_BADGE[post.type] || TYPE_BADGE.post).cls}`} style={{marginBottom:6,display:'inline-block'}}>
            {(TYPE_BADGE[post.type] || TYPE_BADGE.post).label}
          </span>
          <div style={{fontSize:14, fontWeight:600, lineHeight:1.4}}>{post.title}</div>
          {post.body && (
            <div style={{fontSize:13, color:'var(--text3)', marginTop:5, lineHeight:1.5}}>
              {post.body.length > 160 ? post.body.slice(0, 160) + '…' : post.body}
            </div>
          )}
        </div>

        <div className="comments-scroll">
          {comments === null && <div className="spinner" />}
          {comments?.length === 0 && (
            <div className="empty-state" style={{padding:'32px 24px'}}>
              <div className="empty-icon" style={{fontSize:24}}>💬</div>
              <div className="empty-sub">Пока никто не ответил.<br/>Поделитесь своим опытом.</div>
            </div>
          )}
          {comments?.map(c => (
            <div className={`comment ${c.is_solution ? 'comment-solution' : ''}`} key={c.id}>
              {c.is_solution && (
                <div className="solution-badge">
                  <IconCheck size={11} /> Решение
                </div>
              )}
              <div className="comment-head">
                <div className="ava comment-ava"
                     style={{ background: avaColor(c.profiles?.full_name) }}
                     onClick={() => { onClose(); onOpenProfile(c.author_id) }}>
                  {initials(c.profiles?.full_name)}
                </div>
                <div>
                  <div className="comment-name">{c.profiles?.full_name}</div>
                  <div className="comment-meta">
                    {[c.profiles?.dzo?.replace(/^(АО|ТОО)\s*[«"]?/i,'').replace(/[»"]/g,'').trim(),
                      c.profiles?.specialty].filter(Boolean).join(' · ')}
                    {' · '}{timeAgo(c.created_at)}
                  </div>
                </div>
                {isMyPost && post.type === 'question' && !c.is_solution && (
                  <button className="mark-solution-btn" onClick={() => markSolution(c.id)}>
                    <IconCheck size={13} /> Решение
                  </button>
                )}
              </div>
              <div className="comment-text">{c.body}</div>
            </div>
          ))}
        </div>

        <div className="comment-input-row">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ваш ответ..."
          />
          <button className="send-btn" onClick={send} disabled={!text.trim()}>
            <IconSend size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
