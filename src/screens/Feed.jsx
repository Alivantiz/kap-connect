import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { IconHeart, IconComment, IconCase, IconQuestion, IconClose, IconSend } from '../components/Icons'

const AVA_COLORS = ['#3A6BA8', '#2E7D52', '#8B5E1A', '#5B3EA6', '#8B2020', '#1A6B6B']
const avaColor = (name) => AVA_COLORS[(name?.charCodeAt(0) || 0) % AVA_COLORS.length]
const initials = (name) => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'сейчас'
  if (s < 3600) return Math.floor(s / 60) + 'м'
  if (s < 86400) return Math.floor(s / 3600) + 'ч'
  if (s < 604800) return Math.floor(s / 86400) + 'д'
  return new Date(iso).toLocaleDateString('ru')
}

const TYPE_BADGE = {
  case:     { cls: 'badge-case',     label: 'Кейс',   Icon: IconCase },
  question: { cls: 'badge-question', label: 'Вопрос', Icon: IconQuestion },
  post:     { cls: 'badge-post',     label: 'Пост',   Icon: null },
}

export default function Feed({ myId, onOpenProfile }) {
  const [filter, setFilter] = useState('all') // all | dzo | specialty
  const [posts, setPosts] = useState(null)
  const [myLikes, setMyLikes] = useState(new Set())
  const [me, setMe] = useState(null)
  const [openComments, setOpenComments] = useState(null) // post object

  useEffect(() => {
    supabase.from('profiles').select('dzo, specialty').eq('id', myId).single()
      .then(({ data }) => setMe(data))
  }, [myId])

  const load = useCallback(async () => {
    let q = supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(50)
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
    // optimistic
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
        <button className={`tab ${filter==='all'?'active':''}`} onClick={() => setFilter('all')}>Вся группа КАП</button>
        <button className={`tab ${filter==='dzo'?'active':''}`} onClick={() => setFilter('dzo')}>Моё ДЗО</button>
        <button className={`tab ${filter==='specialty'?'active':''}`} onClick={() => setFilter('specialty')}>Специальность</button>
      </div>

      {posts === null && <div className="spinner" />}

      {posts?.length === 0 && (
        <div className="empty">
          Пока пусто.<br />
          Будьте первым — поделитесь кейсом или задайте вопрос.
        </div>
      )}

      {posts?.map(p => {
        const badge = TYPE_BADGE[p.type] || TYPE_BADGE.post
        const liked = myLikes.has(p.id)
        return (
          <div className="post" key={p.id}>
            <div className="post-head">
              <div className="ava" style={{ background: avaColor(p.author_name) }}
                   onClick={() => onOpenProfile(p.author_id)}>
                {initials(p.author_name)}
              </div>
              <div className="post-head-info">
                <div className="post-top">
                  <span className="post-name" onClick={() => onOpenProfile(p.author_id)}>{p.author_name}</span>
                  <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  <span className="post-time">{timeAgo(p.created_at)}</span>
                </div>
                <div className="post-where">
                  {[p.author_dzo, p.author_position || p.author_specialty].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
            <div className="post-body">
              <div className="post-title">{p.title}</div>
              {p.body && <div className="post-text">{p.body}</div>}
              {p.tags?.length > 0 && (
                <div className="tags">
                  {p.tags.map(t => <span className="tag-chip" key={t}>{t}</span>)}
                </div>
              )}
            </div>
            <div className="post-footer">
              <button className={`action ${liked?'liked':''}`} onClick={() => toggleLike(p)}>
                <IconHeart size={17} active={liked} />
                {p.likes_count > 0 && p.likes_count}
              </button>
              <button className="action" onClick={() => setOpenComments(p)}>
                <IconComment size={17} />
                {p.comments_count > 0 ? `${p.comments_count}` : 'Ответить'}
              </button>
            </div>
          </div>
        )
      })}

      {openComments && (
        <CommentsModal post={openComments} myId={myId}
          onClose={() => { setOpenComments(null); load() }}
          onOpenProfile={onOpenProfile} />
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
      .select('*, profiles!comments_author_id_fkey(full_name, dzo)')
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{display:'flex', flexDirection:'column', padding:0}}>
        <div className="modal-title" style={{padding:'18px 16px 12px', marginBottom:0, borderBottom:'1px solid var(--border)'}}>
          Ответы
          <button className="icon-btn" onClick={onClose}><IconClose size={18} /></button>
        </div>

        <div style={{flex:1, overflowY:'auto', minHeight:120}}>
          <div style={{padding:'12px 16px', borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:14, fontWeight:600}}>{post.title}</div>
            {post.body && <div style={{fontSize:13, color:'var(--text3)', marginTop:4}}>{post.body.slice(0,140)}{post.body.length>140?'…':''}</div>}
          </div>

          {comments === null && <div className="spinner" />}
          {comments?.length === 0 && <div className="empty">Пока никто не ответил.<br/>Поделитесь своим опытом первым.</div>}
          {comments?.map(c => (
            <div className="comment" key={c.id}>
              <div className="ava" style={{ background: avaColor(c.profiles?.full_name) }}
                   onClick={() => { onClose(); onOpenProfile(c.author_id) }}>
                {initials(c.profiles?.full_name)}
              </div>
              <div className="comment-name">
                {c.profiles?.full_name}
                {c.profiles?.dzo && <span style={{color:'var(--text3)', fontWeight:400}}> · {c.profiles.dzo}</span>}
              </div>
              <div className="comment-text">{c.body}</div>
            </div>
          ))}
        </div>

        <div className="comment-input-row">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ваш ответ..."
          />
          <button className="icon-btn" style={{background:'var(--accent)', color:'#fff'}} onClick={send}>
            <IconSend size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
