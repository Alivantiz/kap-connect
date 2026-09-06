import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  listCommunities,
  myCommunityIds,
  updateCommunity,
} from '../lib/db'
import { countLabel } from '../lib/format'
import { IconEdit, IconGroups, IconLock, IconPlus, IconTrash } from '../components/Icons'
import { DOMAIN_ICONS, DOMAIN_ICON_KEYS, DomainIcon } from '../components/DomainIcons'
import Sheet from '../components/ui/Sheet'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { RowSkeleton } from '../components/ui/Skeleton'
import { TextField, TextArea, Field } from '../components/ui/Field'
import { useToast } from '../components/ui/toast-context'
import { useConfirm } from '../components/ui/confirm-context'

const KINDS = [
  { value: 'specialty', label: 'По специальности' },
  { value: 'dzo', label: 'По предприятию' },
  { value: 'interest', label: 'По интересам' },
]

const TABS = [
  { key: 'all', label: 'Все' },
  { key: 'specialty', label: 'Специальности' },
  { key: 'dzo', label: 'Предприятия' },
  { key: 'interest', label: 'Интересы' },
]

export default function Communities({ myId }) {
  const [kind, setKind] = useState('all')
  const [items, setItems] = useState(null)
  const [mine, setMine] = useState(() => new Set())
  const [form, setForm] = useState(null)
  const toast = useToast()
  const confirm = useConfirm()
  const busy = useRef(new Set())

  const load = useCallback(async () => {
    const [list, ids] = await Promise.all([listCommunities(kind), myCommunityIds(myId)])
    if (list.error) {
      toast.error(list.error)
      setItems([])
      return
    }
    setItems(list.data || [])
    if (ids.data) setMine(ids.data)
  }, [kind, myId, toast])

  useEffect(() => {
    load()
  }, [load])

  /** Вступление с откатом: раньше счётчик расходился при любом сбое записи. */
  const toggle = async (c) => {
    if (busy.current.has(c.id)) return
    busy.current.add(c.id)
    const joined = mine.has(c.id)
    const delta = joined ? -1 : 1

    setMine((prev) => {
      const next = new Set(prev)
      if (joined) next.delete(c.id)
      else next.add(c.id)
      return next
    })
    setItems((prev) =>
      prev.map((x) =>
        x.id === c.id ? { ...x, members_count: Math.max(0, Number(x.members_count) + delta) } : x,
      ),
    )

    const { error } = joined ? await leaveCommunity(c.id, myId) : await joinCommunity(c.id, myId)
    busy.current.delete(c.id)
    if (!error) return

    setMine((prev) => {
      const next = new Set(prev)
      if (joined) next.add(c.id)
      else next.delete(c.id)
      return next
    })
    setItems((prev) =>
      prev.map((x) =>
        x.id === c.id ? { ...x, members_count: Math.max(0, Number(x.members_count) - delta) } : x,
      ),
    )
    toast.error(error)
  }

  const remove = async (c) => {
    const yes = await confirm({
      title: 'Удалить сообщество?',
      text: `Участники «${c.name}» потеряют к нему доступ.`,
      action: 'Удалить',
      danger: true,
    })
    if (!yes) return
    const { error } = await deleteCommunity(c.id)
    if (error) return toast.error(error)
    toast.success('Сообщество удалено')
    load()
  }

  const joined = (items || []).filter((c) => mine.has(c.id))
  const rest = (items || []).filter((c) => !mine.has(c.id))

  const card = (c) => (
    <div className="comm" key={c.id}>
      <div className="comm-icon">
        <DomainIcon name={c.icon} size={22} />
      </div>
      <div className="comm-info">
        <div className="comm-top">
          <span className="comm-name">{c.name}</span>
          {c.is_closed && (
            <span className="comm-lock" title="Закрытое сообщество">
              <IconLock size={12} />
            </span>
          )}
        </div>
        {c.description && <p className="comm-desc">{c.description}</p>}
        <div className="comm-meta">
          {countLabel(Number(c.members_count) || 0, 'участник', 'участника', 'участников')}
        </div>
      </div>
      <div className="comm-actions">
        <button
          type="button"
          className={`join ${mine.has(c.id) ? 'join-on' : ''}`}
          onClick={() => toggle(c)}
          aria-pressed={mine.has(c.id)}
        >
          {mine.has(c.id) ? 'Вы в группе' : 'Вступить'}
        </button>
        {c.creator_id === myId && (
          <div className="comm-owner">
            <button
              type="button"
              className="icon-btn icon-btn-sm"
              onClick={() => setForm(c)}
              aria-label={`Изменить ${c.name}`}
            >
              <IconEdit size={15} />
            </button>
            <button
              type="button"
              className="icon-btn icon-btn-sm"
              onClick={() => remove(c)}
              aria-label={`Удалить ${c.name}`}
            >
              <IconTrash size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div className="screen-bar">
        <h1 className="screen-title">Сообщества</h1>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setForm({})}
          aria-label="Создать сообщество"
        >
          <IconPlus size={19} />
        </button>
      </div>

      <div className="segmented" role="group" aria-label="Тип сообществ">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={kind === t.key}
            className={`seg ${kind === t.key ? 'seg-on' : ''}`}
            onClick={() => setKind(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items === null && <RowSkeleton count={4} />}

      {items?.length === 0 && (
        <EmptyState
          icon={IconGroups}
          title="Сообществ пока нет"
          text="Создайте группу по своей специальности — коллеги со всех предприятий смогут вступить."
          action={
            <Button variant="primary" icon={IconPlus} onClick={() => setForm({})}>
              Создать
            </Button>
          }
        />
      )}

      {joined.length > 0 && (
        <>
          <div className="list-label">Мои сообщества</div>
          {joined.map(card)}
        </>
      )}
      {rest.length > 0 && (
        <>
          <div className="list-label">{joined.length > 0 ? 'Другие' : 'Все сообщества'}</div>
          {rest.map(card)}
        </>
      )}
      <div style={{ height: 20 }} />

      {form && (
        <CommunityForm
          existing={form.id ? form : null}
          myId={myId}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null)
            load()
          }}
        />
      )}
    </>
  )
}

function CommunityForm({ existing, myId, onClose, onSaved }) {
  const [name, setName] = useState(existing?.name || '')
  const [desc, setDesc] = useState(existing?.description || '')
  const [icon, setIcon] = useState(existing?.icon || 'gear')
  const [kind, setKind] = useState(existing?.kind || 'specialty')
  const [closed, setClosed] = useState(existing?.is_closed || false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    const n = name.trim()
    if (n.length < 2) return setErr('Название минимум 2 символа')
    setErr('')
    setSaving(true)
    const payload = { name: n, description: desc.trim() || null, icon, kind, is_closed: closed }
    const { data, error } = existing
      ? await updateCommunity(existing.id, payload)
      : await createCommunity({ ...payload, creator_id: myId })
    if (!error && !existing && data) await joinCommunity(data.id, myId)
    setSaving(false)
    if (error) return setErr(error)
    onSaved()
  }

  return (
    <Sheet
      title={existing ? 'Изменить сообщество' : 'Новое сообщество'}
      onClose={onClose}
      size="tall"
      footer={
        <Button variant="primary" size="lg" className="w-full" loading={saving} onClick={save}>
          {existing ? 'Сохранить' : 'Создать'}
        </Button>
      }
    >
      {err && (
        <div className="banner banner-error" role="alert">
          {err}
        </div>
      )}

      <TextField
        label="Название"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Например: Насосное оборудование"
        maxLength={80}
      />
      <TextArea
        label="Описание"
        rows={3}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Кому и зачем эта группа"
        maxLength={500}
      />

      <Field label="Тип" required group>
        {() => (
          <div className="type-picker" role="radiogroup" aria-label="Тип сообщества">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                role="radio"
                aria-checked={kind === k.value}
                className={`type-opt ${kind === k.value ? 'type-opt-on' : ''}`}
                onClick={() => setKind(k.value)}
              >
                <span>{k.label}</span>
              </button>
            ))}
          </div>
        )}
      </Field>

      {/* Вместо палитры эмодзи — отраслевой SVG-набор: одинаково выглядит
          на любой платформе и наследует цвет темы. */}
      <Field label="Знак" required group>
        {() => (
          <div className="icon-grid" role="radiogroup" aria-label="Знак сообщества">
            {DOMAIN_ICON_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={icon === key}
                aria-label={DOMAIN_ICONS[key].label}
                title={DOMAIN_ICONS[key].label}
                className={`icon-pick ${icon === key ? 'icon-pick-on' : ''}`}
                onClick={() => setIcon(key)}
              >
                <DomainIcon name={key} size={21} />
              </button>
            ))}
          </div>
        )}
      </Field>

      <label className="switch">
        <input type="checkbox" checked={closed} onChange={(e) => setClosed(e.target.checked)} />
        <span className="switch-track" aria-hidden="true">
          <span className="switch-knob" />
        </span>
        <span className="switch-label">
          Закрытое сообщество
          <span className="switch-hint">Отмечается замком в списке</span>
        </span>
      </label>
    </Sheet>
  )
}
