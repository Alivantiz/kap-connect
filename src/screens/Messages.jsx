import { useCallback, useEffect, useRef, useState } from 'react'
import {
  listConversations,
  listMessages,
  markMessagesRead,
  openConversation,
  searchPeopleByName,
  sendMessage,
  subscribeToMessages,
} from '../lib/db'
import { dateLabel, dzoCore, timeAgo, timeExact } from '../lib/format'
import {
  IconBack,
  IconClose,
  IconEdit,
  IconEmptyInbox,
  IconHand,
  IconSearch,
  IconSend,
} from '../components/Icons'
import Avatar from '../components/ui/Avatar'
import Sheet from '../components/ui/Sheet'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { RowSkeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/toast-context'

export default function Messages({
  myId,
  onOpenProfile,
  onUnreadChange,
  startWith,
  onStartHandled,
}) {
  const [convs, setConvs] = useState(null)
  const [open, setOpen] = useState(null)
  const [search, setSearch] = useState('')
  const [picker, setPicker] = useState(false)
  const toast = useToast()

  const load = useCallback(async () => {
    const { data, error } = await listConversations(myId)
    if (error) {
      toast.error(error)
      setConvs([])
      return
    }
    setConvs(data || [])
  }, [myId, toast])

  useEffect(() => {
    load()
  }, [load])

  const other = useCallback((c) => (c.user1_id === myId ? c.p2 : c.p1), [myId])

  const start = useCallback(
    async (person) => {
      const { data: convId, error } = await openConversation(person.id)
      if (error) return toast.error(error)
      setOpen({ id: convId, profile: person })
      load()
    },
    [load, toast],
  )

  // Переход «написать» из чужого профиля.
  useEffect(() => {
    if (!startWith) return
    start(startWith).finally(() => onStartHandled?.())
  }, [startWith, start, onStartHandled])

  if (open) {
    return (
      <Chat
        conv={open}
        myId={myId}
        onBack={() => {
          setOpen(null)
          load()
        }}
        onOpenProfile={onOpenProfile}
        onUnreadChange={onUnreadChange}
      />
    )
  }

  const q = search.trim().toLowerCase()
  const list = (convs || []).filter((c) => !q || other(c)?.full_name?.toLowerCase().includes(q))

  return (
    <>
      <div className="screen-bar">
        <h1 className="screen-title">Сообщения</h1>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setPicker(true)}
          aria-label="Новое сообщение"
        >
          <IconEdit size={19} />
        </button>
      </div>

      {convs?.length > 0 && (
        <div className="search-strip">
          <div className="search-box">
            <IconSearch size={15} />
            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по диалогам"
              aria-label="Поиск по диалогам"
              type="search"
            />
            {search && (
              <button
                type="button"
                className="icon-btn icon-btn-sm"
                onClick={() => setSearch('')}
                aria-label="Очистить"
              >
                <IconClose size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {convs === null && <RowSkeleton count={4} />}

      {convs?.length === 0 && (
        <EmptyState
          icon={IconEmptyInbox}
          title="Нет диалогов"
          text="Найдите коллегу через поиск, откройте профиль и нажмите «Написать сообщение»."
        />
      )}

      {convs?.length > 0 && list.length === 0 && (
        <EmptyState icon={IconSearch} text={`По запросу «${search}» диалогов нет.`} />
      )}

      {list.map((c) => {
        const p = other(c)
        return (
          <button
            type="button"
            className="conv"
            key={c.id}
            onClick={() => setOpen({ id: c.id, profile: p })}
          >
            <Avatar name={p?.full_name} size={48} expert={p?.is_expert} />
            <span className="conv-info">
              <span className="conv-top">
                <span className="conv-name">{p?.full_name || 'Профиль удалён'}</span>
                <time className="conv-time">{timeAgo(c.last_msg_at)}</time>
              </span>
              <span className="conv-role">
                {[p?.position, dzoCore(p?.dzo, 2)].filter(Boolean).join(' · ')}
              </span>
              {c.last_message && <span className="conv-last">{c.last_message}</span>}
            </span>
          </button>
        )
      })}

      {picker && (
        <PeoplePicker
          myId={myId}
          onClose={() => setPicker(false)}
          onPick={(p) => {
            setPicker(false)
            start(p)
          }}
        />
      )}
    </>
  )
}

function PeoplePicker({ myId, onClose, onPick }) {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const reqId = useRef(0)

  useEffect(() => {
    if (!q.trim()) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      const id = ++reqId.current
      const { data } = await searchPeopleByName(q, myId)
      if (id !== reqId.current) return
      setLoading(false)
      setRows(data || [])
    }, 280)
    return () => clearTimeout(t)
  }, [q, myId])

  return (
    <Sheet title="Новое сообщение" onClose={onClose}>
      <div className="search-box" style={{ marginBottom: 14 }}>
        <IconSearch size={15} />
        <input
          className="search-input"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Имя сотрудника"
          aria-label="Поиск сотрудника"
        />
      </div>
      {loading && <RowSkeleton count={3} />}
      {!loading &&
        rows.map((p) => (
          <button type="button" className="person person-sm" key={p.id} onClick={() => onPick(p)}>
            <Avatar name={p.full_name} size={40} />
            <span className="person-info">
              <span className="person-name">{p.full_name}</span>
              <span className="person-meta">
                <span>{[p.position, dzoCore(p.dzo, 2)].filter(Boolean).join(' · ')}</span>
              </span>
            </span>
          </button>
        ))}
      {!loading && q.trim() && rows.length === 0 && (
        <EmptyState icon={IconSearch} text="Никого не нашли" />
      )}
    </Sheet>
  )
}

function Chat({ conv, myId, onBack, onOpenProfile, onUnreadChange }) {
  const [messages, setMessages] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)
  const toast = useToast()

  useEffect(() => {
    let alive = true
    listMessages(conv.id).then(({ data, error }) => {
      if (!alive) return
      if (error) return toast.error(error)
      setMessages(data || [])
    })
    markMessagesRead(conv.id, myId).then(() => onUnreadChange?.())
    return () => {
      alive = false
    }
  }, [conv.id, myId, toast, onUnreadChange])

  // Новое сообщение добавляется в список, а не перезагружает весь диалог:
  // раньше каждая отправка стоила двух полных запросов.
  useEffect(
    () =>
      subscribeToMessages(conv.id, (row) => {
        setMessages((prev) => {
          if (!prev) return prev
          if (prev.some((m) => m.id === row.id)) return prev
          return [...prev, row]
        })
        if (row.sender_id !== myId) markMessagesRead(conv.id, myId).then(() => onUnreadChange?.())
      }),
    [conv.id, myId, onUnreadChange],
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    const { data, error } = await sendMessage(conv.id, myId, body)
    setSending(false)
    if (error) {
      // Текст возвращается в поле — раньше он просто исчезал при сбое.
      toast.error(error)
      return
    }
    setText('')
    if (data) {
      setMessages((prev) => (prev?.some((m) => m.id === data.id) ? prev : [...(prev || []), data]))
    }
  }

  const groups = []
  let lastDay = ''
  for (const m of messages || []) {
    const day = dateLabel(m.created_at)
    if (day !== lastDay) {
      groups.push({ kind: 'day', key: `d-${m.id}`, label: day })
      lastDay = day
    }
    groups.push({ kind: 'msg', key: m.id, ...m })
  }

  return (
    <div className="chat">
      <header className="chat-bar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Назад к диалогам">
          <IconBack size={19} />
        </button>
        <Avatar
          name={conv.profile?.full_name}
          size={38}
          onClick={() => onOpenProfile(conv.profile?.id)}
        />
        <button type="button" className="chat-who" onClick={() => onOpenProfile(conv.profile?.id)}>
          <span className="chat-name">{conv.profile?.full_name}</span>
          <span className="chat-role">
            {[conv.profile?.position, dzoCore(conv.profile?.dzo, 2)].filter(Boolean).join(' · ')}
          </span>
        </button>
      </header>

      <div className="chat-scroll">
        {messages === null && (
          <div className="center-pad">
            <Spinner />
          </div>
        )}
        {messages?.length === 0 && (
          <EmptyState
            icon={IconHand}
            text="Напишите первое сообщение — коллега получит уведомление."
          />
        )}
        {groups.map((g) =>
          g.kind === 'day' ? (
            <div className="chat-day" key={g.key}>
              {g.label}
            </div>
          ) : (
            <div className={`bubble-row ${g.sender_id === myId ? 'mine' : 'theirs'}`} key={g.key}>
              <div className={`bubble ${g.sender_id === myId ? 'mine' : 'theirs'}`}>
                {g.body}
                <span className="bubble-time">{timeExact(g.created_at)}</span>
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <div className="composer composer-chat">
        <input
          className="composer-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Сообщение…"
          aria-label="Текст сообщения"
          maxLength={4000}
        />
        <button
          type="button"
          className="send"
          onClick={send}
          disabled={!text.trim() || sending}
          aria-label="Отправить"
        >
          {sending ? <Spinner size={16} inline /> : <IconSend size={17} />}
        </button>
      </div>
    </div>
  )
}
