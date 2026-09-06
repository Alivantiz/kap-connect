import { useCallback, useEffect, useRef, useState } from 'react'
import { listNotifications, markNotificationsRead } from '../lib/db'
import { dzoCore, timeAgo, truncate } from '../lib/format'
import { IconCheck, IconComment, IconEmptyBell, IconHeart, IconMessages } from '../components/Icons'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import { RowSkeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/toast-context'

const KINDS = {
  like: { Icon: IconHeart, tone: 'tone-red', text: 'оценил вашу публикацию' },
  comment: { Icon: IconComment, tone: 'tone-accent', text: 'ответил на вашу публикацию' },
  solution: { Icon: IconCheck, tone: 'tone-green', text: 'отметил ваш ответ решением' },
  message: { Icon: IconMessages, tone: 'tone-accent', text: 'написал вам сообщение' },
}

const TABS = [
  { key: 'all', label: 'Все' },
  { key: 'like', label: 'Оценки' },
  { key: 'comment', label: 'Ответы' },
  { key: 'solution', label: 'Решения' },
]

export default function Activity({ myId, onOpenProfile, onRead }) {
  const [items, setItems] = useState(null)
  const [filter, setFilter] = useState('all')
  const toast = useToast()
  // Ссылка вместо зависимости: onRead приходит из App новой функцией на
  // каждый рендер и иначе перезапускал бы загрузку вместе с UPDATE.
  const onReadRef = useRef(onRead)
  onReadRef.current = onRead

  // Загрузка и отметка прочитанного разделены. Раньше они были в одном
  // useCallback вместе с нестабильным onRead, поэтому каждый тик таймера
  // в App перезапрашивал 50 строк и повторно слал UPDATE.
  useEffect(() => {
    let alive = true
    listNotifications(myId).then(({ data, error }) => {
      if (!alive) return
      if (error) return toast.error(error)
      setItems(data || [])
      // Отметка прочитанного идёт строго после списка: иначе непрочитанные
      // подсвечивались через раз, в зависимости от того, какой запрос успел.
      markNotificationsRead(myId).then((r) => {
        if (alive && !r.error) onReadRef.current?.()
      })
    })
    return () => {
      alive = false
    }
  }, [myId, toast])

  const openActor = useCallback(
    (id) => {
      // Если автор удалён, join вернёт null. Раньше undefined доходил
      // до App и открывал СВОЙ профиль без кнопки «назад».
      if (id) onOpenProfile(id)
    },
    [onOpenProfile],
  )

  const shown = filter === 'all' ? items || [] : (items || []).filter((n) => n.type === filter)

  return (
    <>
      <div className="screen-bar">
        <h1 className="screen-title">Активность</h1>
      </div>

      <div className="segmented" role="group" aria-label="Фильтр уведомлений">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={filter === t.key}
            className={`seg ${filter === t.key ? 'seg-on' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items === null && <RowSkeleton count={5} />}

      {items?.length === 0 && (
        <EmptyState
          icon={IconEmptyBell}
          title="Нет уведомлений"
          text="Здесь появятся ответы на ваши публикации, оценки коллег и отметки решений."
        />
      )}

      {/* Раньше пустое состояние проверяло весь список, а рендерился
          отфильтрованный: при выборе вкладки без событий экран был пустым. */}
      {items?.length > 0 && shown.length === 0 && (
        <EmptyState icon={IconEmptyBell} text="В этой категории пока пусто." />
      )}

      {shown.map((n) => {
        const k = KINDS[n.type] || KINDS.comment
        const { Icon } = k
        const actor = n.actor
        return (
          <button
            type="button"
            className={`notif ${n.read ? '' : 'notif-new'}`}
            key={n.id}
            onClick={() => openActor(actor?.id)}
          >
            <span className="notif-ava">
              <Avatar name={actor?.full_name} size={44} />
              <span className={`notif-kind ${k.tone}`}>
                <Icon size={11} />
              </span>
            </span>
            <span className="notif-info">
              <span className="notif-text">
                <span className="notif-name">{actor?.full_name || 'Пользователь'}</span> {k.text}
              </span>
              {n.post?.title && <span className="notif-post">«{truncate(n.post.title, 64)}»</span>}
              <span className="notif-meta">
                {[dzoCore(actor?.dzo, 2), timeAgo(n.created_at)].filter(Boolean).join(' · ')}
              </span>
            </span>
          </button>
        )
      })}
      <div style={{ height: 20 }} />
    </>
  )
}
