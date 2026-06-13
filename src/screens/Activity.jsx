import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { IconHeart, IconComment, IconCheck } from '../components/Icons'

const AVA_COLORS = ['#3A6BA8','#2E7D52','#8B5E1A','#5B3EA6','#7A3030','#1A6B6B','#4A6B1A','#6B1A5B']
const avaColor = (name) => AVA_COLORS[(name?.charCodeAt(0)||0) % AVA_COLORS.length]
const initials = (name) => (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()

const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'сейчас'
  if (s < 3600) return Math.floor(s/60) + 'м'
  if (s < 86400) return Math.floor(s/3600) + 'ч'
  if (s < 604800) return Math.floor(s/86400) + 'д'
  return new Date(iso).toLocaleDateString('ru', { day:'numeric', month:'short' })
}

const TYPE_CONFIG = {
  like:     { Icon: IconHeart,   color: 'var(--red)',    text: 'оценил ваш пост' },
  comment:  { Icon: IconComment, color: 'var(--accent)', text: 'ответил на ваш пост' },
  solution: { Icon: IconCheck,   color: 'var(--green)',  text: 'отметил ваш ответ как решение' },
}

export default function Activity({ myId, onOpenProfile, onRead }) {
  const [notifs, setNotifs] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(id,full_name,position),
        post:posts(title)
      `)
      .eq('user_id', myId)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifs(data || [])

    // Отмечаем все прочитанными
    await supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', myId).eq('read', false)
    onRead?.()
  }, [myId, onRead])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all'
    ? (notifs || [])
    : (notifs || []).filter(n => n.type === filter)

  return (
    <>
      <div className="screen-header">
        <div className="screen-title">Активность</div>
      </div>

      <div className="seg">
        <button className={`seg-btn ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>Все</button>
        <button className={`seg-btn ${filter==='like'?'active':''}`} onClick={()=>setFilter('like')}>Лайки</button>
        <button className={`seg-btn ${filter==='comment'?'active':''}`} onClick={()=>setFilter('comment')}>Ответы</button>
      </div>

      {notifs === null && <div className="spinner" />}

      {notifs?.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <div className="empty-title">Нет уведомлений</div>
          <div className="empty-sub">Когда коллеги ответят на ваши посты или оценят их — вы увидите это здесь.</div>
        </div>
      )}

      {filtered.map(n => {
        const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.comment
        const Icon = cfg.Icon
        return (
          <div
            key={n.id}
            className={`notif-item ${!n.read ? 'unread' : ''}`}
            onClick={() => onOpenProfile(n.actor?.id)}
          >
            <div style={{ position:'relative', flexShrink:0 }}>
              <div className="ava" style={{ background: avaColor(n.actor?.full_name), width:44, height:44, fontSize:15 }}>
                {initials(n.actor?.full_name)}
              </div>
              <div className="notif-icon-badge" style={{ background: cfg.color }}>
                <Icon size={10} color="#fff" />
              </div>
            </div>
            <div className="notif-info">
              <div className="notif-text">
                <span className="notif-name">{n.actor?.full_name}</span>
                {' '}{cfg.text}
              </div>
              {n.post?.title && (
                <div className="notif-post">«{n.post.title.slice(0, 60)}{n.post.title.length > 60 ? '…' : ''}»</div>
              )}
              <div className="notif-time">{timeAgo(n.created_at)}</div>
            </div>
          </div>
        )
      })}
    </>
  )
}
