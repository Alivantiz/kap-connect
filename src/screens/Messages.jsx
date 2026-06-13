import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { IconBack, IconSend, IconSearch, IconClose } from '../components/Icons'

const AVA_COLORS = ['#3A6BA8','#2E7D52','#8B5E1A','#5B3EA6','#7A3030','#1A6B6B','#4A6B1A','#6B1A5B']
const avaColor = (name) => AVA_COLORS[(name?.charCodeAt(0)||0) % AVA_COLORS.length]
const initials = (name) => (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()

const timeAgo = (iso) => {
  if (!iso) return ''
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'сейчас'
  if (s < 3600) return Math.floor(s/60) + 'м'
  if (s < 86400) return Math.floor(s/3600) + 'ч'
  if (s < 604800) return Math.floor(s/86400) + 'д'
  return new Date(iso).toLocaleDateString('ru', { day:'numeric', month:'short' })
}

const timeExact = (iso) =>
  new Date(iso).toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' })

export default function Messages({ myId, myProfile, onOpenProfile, onUnreadChange }) {
  const [convs, setConvs]       = useState(null)
  const [openConv, setOpenConv] = useState(null) // { id, profile }
  const [search, setSearch]     = useState('')

  const loadConvs = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        p1:profiles!conversations_user1_id_fkey(id,full_name,position,dzo),
        p2:profiles!conversations_user2_id_fkey(id,full_name,position,dzo)
      `)
      .or(`user1_id.eq.${myId},user2_id.eq.${myId}`)
      .order('last_msg_at', { ascending: false })
    setConvs(data || [])

    // Считаем непрочитанные
    const { count } = await supabase
      .from('messages').select('id', { count:'exact', head:true })
      .eq('read', false).neq('sender_id', myId)
    onUnreadChange?.(count || 0)
  }, [myId, onUnreadChange])

  useEffect(() => { loadConvs() }, [loadConvs])

  // Realtime обновления
  useEffect(() => {
    const ch = supabase.channel('convs')
      .on('postgres_changes', { event:'*', schema:'public', table:'conversations' }, loadConvs)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [loadConvs])

  const openChat = (conv) => {
    const other = conv.user1_id === myId ? conv.p2 : conv.p1
    setOpenConv({ id: conv.id, profile: other })
  }

  // Начать новый диалог
  const startChat = async (otherProfile) => {
    const [a, b] = [myId, otherProfile.id].sort()
    // проверяем существующий
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${a},user2_id.eq.${b}),and(user1_id.eq.${b},user2_id.eq.${a})`)
      .single()

    if (existing) {
      setOpenConv({ id: existing.id, profile: otherProfile })
    } else {
      const { data: created } = await supabase
        .from('conversations')
        .insert({ user1_id: myId, user2_id: otherProfile.id })
        .select().single()
      if (created) setOpenConv({ id: created.id, profile: otherProfile })
    }
    loadConvs()
  }

  if (openConv) {
    return (
      <Chat
        conv={openConv}
        myId={myId}
        onBack={() => { setOpenConv(null); loadConvs() }}
        onOpenProfile={onOpenProfile}
      />
    )
  }

  const filtered = (convs || []).filter(c => {
    const other = c.user1_id === myId ? c.p2 : c.p1
    return !search || other?.full_name?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <div className="screen-header">
        <div className="screen-title">Сообщения</div>
        <NewChatBtn myId={myId} onSelect={startChat} />
      </div>

      <div className="search-filters" style={{ paddingBottom:8 }}>
        <div className="search-field">
          <IconSearch size={16} color="var(--text3)" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск диалогов..." />
          {search && <button className="clear-btn" onClick={()=>setSearch('')}><IconClose size={14}/></button>}
        </div>
      </div>

      {convs === null && <div className="spinner" />}

      {convs?.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <div className="empty-title">Нет сообщений</div>
          <div className="empty-sub">Напишите коллеге — найдите его через поиск и откройте профиль.</div>
        </div>
      )}

      {filtered.map(conv => {
        const other = conv.user1_id === myId ? conv.p2 : conv.p1
        return (
          <div className="conv-item" key={conv.id} onClick={() => openChat(conv)}>
            <div className="ava" style={{ background: avaColor(other?.full_name), width:48, height:48, fontSize:16, flexShrink:0 }}>
              {initials(other?.full_name)}
            </div>
            <div className="conv-info">
              <div className="conv-name-row">
                <div className="conv-name">{other?.full_name || '—'}</div>
                <div className="conv-time">{timeAgo(conv.last_msg_at)}</div>
              </div>
              <div className="conv-preview">
                {other?.position || other?.dzo || ''}
              </div>
              {conv.last_message && (
                <div className="conv-last">{conv.last_message}</div>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}

// Кнопка начать новый диалог — поиск пользователей
function NewChatBtn({ myId, onSelect }) {
  const [open, setOpen]       = useState(false)
  const [q, setQ]             = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id,full_name,position,dzo')
        .ilike('full_name', `%${q}%`).neq('id', myId).limit(20)
      setResults(data || [])
    }, 300)
    return () => clearTimeout(t)
  }, [q, myId])

  if (!open) return (
    <button className="icon-btn" onClick={() => setOpen(true)} title="Новое сообщение">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    </button>
  )

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">
          Новое сообщение
          <button className="icon-btn" onClick={()=>setOpen(false)}><IconClose size={18}/></button>
        </div>
        <div className="search-field" style={{ marginBottom:12 }}>
          <IconSearch size={16} color="var(--text3)" />
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Найти сотрудника..." />
        </div>
        {results.map(p => (
          <div key={p.id} className="expert" style={{ padding:'10px 0' }}
            onClick={() => { onSelect(p); setOpen(false) }}>
            <div className="ava" style={{ background:avaColor(p.full_name), width:40, height:40, fontSize:14, flexShrink:0 }}>
              {initials(p.full_name)}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>{p.full_name}</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                {[p.position, p.dzo].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
        ))}
        {q && results.length === 0 && (
          <div className="empty-sub" style={{ padding:'16px 0' }}>Никого не нашли</div>
        )}
      </div>
    </div>
  )
}

// Экран чата
function Chat({ conv, myId, onBack, onOpenProfile }) {
  const [messages, setMessages] = useState(null)
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    // Отмечаем прочитанными
    await supabase.from('messages')
      .update({ read: true })
      .eq('conversation_id', conv.id)
      .eq('read', false)
      .neq('sender_id', myId)
  }, [conv.id, myId])

  useEffect(() => { load() }, [load])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('chat-' + conv.id)
      .on('postgres_changes', {
        event:'INSERT', schema:'public', table:'messages',
        filter:`conversation_id=eq.${conv.id}`
      }, () => load())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [conv.id, load])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const body = text.trim()
    setText('')
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_id: myId,
      body,
    })
    await supabase.from('conversations').update({
      last_message: body,
      last_msg_at: new Date().toISOString(),
    }).eq('id', conv.id)
    setSending(false)
    load()
  }

  // Группировка по дате
  const grouped = []
  let lastDate = ''
  for (const m of messages || []) {
    const d = new Date(m.created_at).toLocaleDateString('ru', { day:'numeric', month:'long' })
    if (d !== lastDate) { grouped.push({ type:'date', label:d }); lastDate = d }
    grouped.push({ type:'msg', ...m })
  }

  return (
    <div className="chat-wrap">
      {/* Шапка чата */}
      <div className="chat-header">
        <button className="icon-btn" onClick={onBack}><IconBack size={19}/></button>
        <div className="ava chat-ava"
          style={{ background: avaColor(conv.profile?.full_name) }}
          onClick={() => onOpenProfile(conv.profile?.id)}>
          {initials(conv.profile?.full_name)}
        </div>
        <div className="chat-header-info" onClick={() => onOpenProfile(conv.profile?.id)}>
          <div className="chat-name">{conv.profile?.full_name}</div>
          <div className="chat-role">{conv.profile?.position || conv.profile?.dzo || ''}</div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="chat-messages">
        {messages === null && <div className="spinner" />}
        {messages?.length === 0 && (
          <div className="empty-state" style={{ padding:'40px 24px' }}>
            <div className="empty-icon">👋</div>
            <div className="empty-sub">Начните диалог — напишите первое сообщение.</div>
          </div>
        )}
        {grouped.map((item, i) =>
          item.type === 'date' ? (
            <div key={'d'+i} className="chat-date-divider">{item.label}</div>
          ) : (
            <div key={item.id}
              className={`chat-bubble-wrap ${item.sender_id === myId ? 'mine' : 'theirs'}`}>
              <div className={`chat-bubble ${item.sender_id === myId ? 'mine' : 'theirs'}`}>
                {item.body}
                <span className="bubble-time">{timeExact(item.created_at)}</span>
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Ввод */}
      <div className="chat-input-row">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Сообщение..."
        />
        <button className="send-btn" onClick={send} disabled={!text.trim()}>
          <IconSend size={16} />
        </button>
      </div>
    </div>
  )
}
