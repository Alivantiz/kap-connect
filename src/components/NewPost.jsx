import { useState } from 'react'
import { createPost } from '../lib/db'
import { parseList } from '../lib/format'
import { IconCase, IconPost, IconQuestion } from './Icons'
import Sheet from './ui/Sheet'
import Button from './ui/Button'
import { TextField, TextArea } from './ui/Field'
import { useToast } from './ui/toast-context'
import { useConfirm } from './ui/confirm-context'

const TYPES = [
  {
    key: 'post',
    label: 'Пост',
    Icon: IconPost,
    hint: 'Новость, мысль или достижение — коротко и по делу.',
  },
  {
    key: 'case',
    label: 'Кейс',
    Icon: IconCase,
    hint: 'Что случилось, что пробовали, что сработало. Это останется в базе опыта.',
  },
  {
    key: 'question',
    label: 'Вопрос',
    Icon: IconQuestion,
    hint: 'Опишите ситуацию — подскажут коллеги с других предприятий.',
  },
]

const MAX_TITLE = 200
const MAX_BODY = 8000

export default function NewPost({ myId, onClose, onPosted }) {
  const [type, setType] = useState('post')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const toast = useToast()
  const confirm = useConfirm()

  const active = TYPES.find((t) => t.key === type)

  const publish = async () => {
    const t = title.trim()
    if (!t) {
      setErr('Заголовок обязателен')
      return
    }
    setErr('')
    setSaving(true)
    const { error } = await createPost({
      author_id: myId,
      type,
      title: t.slice(0, MAX_TITLE),
      body: body.trim().slice(0, MAX_BODY),
      // Теги приводятся к нижнему регистру: иначе «Насосы» и «насосы»
      // навсегда остаются разными тегами и поиск по ним разваливается.
      tags: parseList(tags)
        .map((x) => x.toLowerCase())
        .slice(0, 8),
    })
    setSaving(false)
    if (error) {
      setErr(error)
      return
    }
    toast.success('Опубликовано')
    onPosted()
  }

  const close = async () => {
    const dirty = title.trim() || body.trim() || tags.trim()
    if (!dirty) return onClose()
    const yes = await confirm({
      title: 'Закрыть без публикации?',
      text: 'Черновик не сохранится.',
      action: 'Закрыть',
      danger: true,
    })
    if (yes) onClose()
  }

  return (
    <Sheet
      title="Новая публикация"
      onClose={close}
      footer={
        <Button variant="primary" size="lg" className="w-full" loading={saving} onClick={publish}>
          Опубликовать
        </Button>
      }
    >
      <div className="type-picker" role="radiogroup" aria-label="Тип публикации">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={type === t.key}
            className={`type-opt ${type === t.key ? 'type-opt-on' : ''}`}
            onClick={() => setType(t.key)}
          >
            <t.Icon size={17} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      <p className="type-hint">{active.hint}</p>

      {err && (
        <div className="banner banner-error" role="alert">
          {err}
        </div>
      )}

      <TextField
        label="Заголовок"
        required
        maxLength={MAX_TITLE}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={
          type === 'question'
            ? 'Кто сталкивался с…'
            : type === 'case'
              ? 'Как мы решили проблему с…'
              : 'О чём расскажете?'
        }
      />
      <TextArea
        label="Текст"
        rows={7}
        maxLength={MAX_BODY}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={type === 'case' ? 'Ситуация → что пробовали → что сработало' : 'Подробности…'}
      />
      <TextField
        label="Теги"
        hint="Через запятую. По ним вас найдут коллеги."
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="насосы, siemens, бурение"
      />
    </Sheet>
  )
}
