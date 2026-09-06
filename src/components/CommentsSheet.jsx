import { useCallback, useEffect, useRef, useState } from 'react'
import { addComment, deleteComment, listComments, markSolution } from '../lib/db'
import { dzoCore, timeAgo, truncate } from '../lib/format'
import { IconCheck, IconSend, IconTrash, IconComment } from './Icons'
import Avatar from './ui/Avatar'
import Sheet from './ui/Sheet'
import EmptyState from './ui/EmptyState'
import Spinner from './ui/Spinner'
import { useToast } from './ui/toast-context'
import { postType } from '../lib/postTypes'

export default function CommentsSheet({ post, myId, onClose, onOpenProfile, onChanged }) {
  const [comments, setComments] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const toast = useToast()
  const endRef = useRef(null)

  const load = useCallback(async () => {
    const { data, error } = await listComments(post.id)
    if (error) return toast.error(error)
    setComments(data || [])
  }, [post.id, toast])

  useEffect(() => {
    load()
  }, [load])

  // Прокрутка вниз после отрисовки списка: раньше она вызывалась сразу
  // после загрузки и попадала на предыдущий последний ответ.
  useEffect(() => {
    if (comments?.length) endRef.current?.scrollIntoView({ block: 'end' })
  }, [comments])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    const { error } = await addComment(post.id, myId, body)
    setSending(false)
    if (error) return toast.error(error)
    setText('')
    await load()
    onChanged?.()
  }

  // Отметка решения идёт через RPC: автор вопроса меняет чужой комментарий,
  // прямой update отклонила бы политика RLS.
  const solve = async (commentId) => {
    const { error } = await markSolution(commentId)
    if (error) return toast.error(error)
    await load()
    onChanged?.()
  }

  const remove = async (commentId) => {
    const { error } = await deleteComment(commentId)
    if (error) return toast.error(error)
    await load()
    onChanged?.()
  }

  const t = postType(post.type)
  const canSolve = post.author_id === myId && post.type === 'question'

  return (
    <Sheet
      title="Ответы"
      onClose={onClose}
      size="tall"
      footer={
        <div className="composer">
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
            placeholder="Ваш ответ…"
            aria-label="Текст ответа"
            maxLength={4000}
          />
          <button
            type="button"
            className="send"
            onClick={send}
            disabled={!text.trim() || sending}
            aria-label="Отправить ответ"
          >
            {sending ? <Spinner size={16} inline /> : <IconSend size={17} />}
          </button>
        </div>
      }
    >
      <div className="quoted">
        <span className={`type-badge ${t.cls}`}>
          <t.Icon size={12} />
          {t.label}
        </span>
        <div className="quoted-title">{post.title}</div>
        {post.body && <div className="quoted-text">{truncate(post.body, 180)}</div>}
      </div>

      {comments === null && (
        <div className="center-pad">
          <Spinner />
        </div>
      )}

      {comments?.length === 0 && (
        <EmptyState
          icon={IconComment}
          text="Пока никто не ответил. Поделитесь своим опытом — коллегам это поможет."
        />
      )}

      {comments?.map((c) => {
        const author = c.profiles
        const meta = [dzoCore(author?.dzo, 2), author?.position || author?.specialty]
          .filter(Boolean)
          .join(' · ')
        return (
          <div className={`comment ${c.is_solution ? 'comment-solved' : ''}`} key={c.id}>
            {c.is_solution && (
              <div className="solution-tag">
                <IconCheck size={11} /> Решение
              </div>
            )}
            <div className="comment-head">
              <Avatar
                name={author?.full_name}
                size={34}
                expert={author?.is_expert}
                onClick={() => {
                  onClose()
                  onOpenProfile(c.author_id)
                }}
              />
              <div className="comment-who">
                <div className="comment-name">{author?.full_name || 'Профиль удалён'}</div>
                <div className="comment-meta">
                  {meta}
                  {meta && ' · '}
                  {timeAgo(c.created_at)}
                </div>
              </div>
              {canSolve && !c.is_solution && c.author_id !== myId && (
                <button type="button" className="solve-btn" onClick={() => solve(c.id)}>
                  <IconCheck size={13} /> Решение
                </button>
              )}
              {c.author_id === myId && (
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => remove(c.id)}
                  aria-label="Удалить ответ"
                >
                  <IconTrash size={15} />
                </button>
              )}
            </div>
            <p className="comment-text">{c.body}</p>
          </div>
        )
      })}
      <div ref={endRef} />
    </Sheet>
  )
}
