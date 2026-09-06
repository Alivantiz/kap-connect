import { useCallback, useEffect, useState } from 'react'
import { getProfile, getProfileStats, listDzo, updateProfile, auth } from '../lib/db'
import { cleanTelegram, dzoCore, parseList } from '../lib/format'
import {
  IconBack,
  IconBriefcase,
  IconEdit,
  IconIdea,
  IconLocation,
  IconLogout,
  IconMessages,
  IconStar,
  IconTelegram,
  IconAlert,
  IconRefresh,
} from '../components/Icons'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Sheet from '../components/ui/Sheet'
import EmptyState from '../components/ui/EmptyState'
import { TextField, TextArea, SelectField } from '../components/ui/Field'
import { RowSkeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/toast-context'

export default function Profile({ profileId, isMe, onBack, onProfileSaved, onMessage }) {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const toast = useToast()

  const load = useCallback(async () => {
    setError('')
    setProfile(null)
    const [p, s] = await Promise.all([getProfile(profileId), getProfileStats(profileId)])
    return { p, s }
  }, [profileId])

  // Гонка запросов: при быстром переходе между профилями старый ответ
  // мог прийти вторым и подменить данные нового человека.
  useEffect(() => {
    let alive = true
    load().then(({ p, s }) => {
      if (!alive) return
      if (p.error) return setError(p.error)
      if (!p.data) return setError('Профиль не найден. Возможно, он ещё не создан.')
      setProfile(p.data)
      setStats(s.data || null)
    })
    return () => {
      alive = false
    }
  }, [load])

  if (error) {
    return (
      <>
        {onBack && (
          <div className="screen-bar">
            <button type="button" className="icon-btn" onClick={onBack} aria-label="Назад">
              <IconBack size={19} />
            </button>
          </div>
        )}
        <EmptyState
          icon={IconAlert}
          title="Профиль недоступен"
          text={error}
          action={
            <Button variant="ghost" icon={IconRefresh} onClick={() => setError('')}>
              Повторить
            </Button>
          }
        />
      </>
    )
  }

  if (!profile) return <RowSkeleton count={3} />

  const role = profile.position || profile.specialty
  const incomplete =
    isMe && !profile.position && !profile.bio && (profile.skills?.length || 0) === 0

  return (
    <>
      {onBack && (
        <div className="screen-bar">
          <button type="button" className="icon-btn" onClick={onBack} aria-label="Назад">
            <IconBack size={19} />
          </button>
        </div>
      )}

      <header className="prof-head">
        <Avatar name={profile.full_name} size={76} expert={profile.is_expert} />
        <div className="prof-id">
          <h1 className="prof-name">{profile.full_name}</h1>
          {role && (
            <div className="prof-role">
              <IconBriefcase size={13} /> {role}
            </div>
          )}
          {(profile.dzo || profile.region) && (
            <div className="prof-place">
              <IconLocation size={13} />
              {[dzoCore(profile.dzo), profile.region].filter(Boolean).join(' · ')}
            </div>
          )}
          {profile.is_expert && (
            <span className="expert-pill">
              <IconStar size={12} active /> Эксперт
            </span>
          )}
        </div>
      </header>

      <div className="prof-stats">
        <div className="stat">
          <div className="stat-val">{stats?.posts_count ?? 0}</div>
          <div className="stat-key">публикаций</div>
        </div>
        <div className="stat">
          <div className="stat-val">{stats?.answers_count ?? 0}</div>
          <div className="stat-key">ответов</div>
        </div>
        <div className="stat">
          <div className="stat-val">{stats?.solutions_count ?? 0}</div>
          <div className="stat-key">решений</div>
        </div>
        <div className="stat">
          <div className="stat-val">{profile.experience_years || '—'}</div>
          <div className="stat-key">лет стажа</div>
        </div>
      </div>

      {profile.bio && (
        <section className="prof-block">
          <h2 className="block-label">О себе</h2>
          <p className="bio">{profile.bio}</p>
        </section>
      )}

      {profile.skills?.length > 0 && (
        <section className="prof-block">
          <h2 className="block-label">Навыки</h2>
          <div className="chips">
            {profile.skills.map((s, i) => (
              <span className={`chip ${i < 3 ? 'chip-hi' : ''}`} key={`${s}-${i}`}>
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {profile.equipment?.length > 0 && (
        <section className="prof-block">
          <h2 className="block-label">Оборудование</h2>
          <div className="chips">
            {profile.equipment.map((s, i) => (
              <span className="chip" key={`${s}-${i}`}>
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {incomplete && (
        <div className="nudge">
          <IconIdea size={19} />
          <span>
            Заполните профиль — должность, навыки и оборудование. По ним коллеги находят вас в
            поиске экспертов.
          </span>
        </div>
      )}

      <div className="prof-actions">
        {isMe ? (
          <>
            <Button
              variant="primary"
              size="lg"
              icon={IconEdit}
              className="w-full"
              onClick={() => setEditing(true)}
            >
              Редактировать профиль
            </Button>
            <Button
              variant="ghost"
              size="md"
              icon={IconLogout}
              className="w-full"
              onClick={() => auth.signOut()}
            >
              Выйти
            </Button>
          </>
        ) : (
          <>
            {/* Раньше App передавал onMessage, но Profile его не принимал:
                написать человеку из его профиля было невозможно. */}
            <Button
              variant="primary"
              size="lg"
              icon={IconMessages}
              className="w-full"
              onClick={() => onMessage?.(profile)}
            >
              Написать сообщение
            </Button>
            {profile.telegram && (
              <a
                className="btn btn-ghost btn-md w-full"
                href={`https://t.me/${cleanTelegram(profile.telegram)}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <IconTelegram size={17} />
                <span>Telegram</span>
              </a>
            )}
          </>
        )}
      </div>

      <div style={{ height: 24 }} />

      {editing && (
        <EditProfile
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(p) => {
            setProfile(p)
            onProfileSaved?.(p)
            setEditing(false)
            toast.success('Профиль сохранён')
          }}
        />
      )}
    </>
  )
}

function EditProfile({ profile, onClose, onSaved }) {
  const [dzoList, setDzoList] = useState([])
  const [dzoReady, setDzoReady] = useState(false)
  const [f, setF] = useState({
    full_name: profile.full_name || '',
    position: profile.position || '',
    dzo: profile.dzo || '',
    region: profile.region || '',
    experience_years: profile.experience_years ? String(profile.experience_years) : '',
    bio: profile.bio || '',
    skills: (profile.skills || []).join(', '),
    equipment: (profile.equipment || []).join(', '),
    telegram: profile.telegram || '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    listDzo().then(({ data }) => {
      // Пока справочник не загружен, список ДЗО пуст. Раньше select в этот
      // момент показывал пустое значение, и любое касание стирало ДЗО из профиля.
      const list = data || []
      setDzoList(profile.dzo && !list.includes(profile.dzo) ? [profile.dzo, ...list] : list)
      setDzoReady(true)
    })
  }, [profile.dzo])

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    if (!f.full_name.trim()) return setErr('Имя обязательно')
    const years = f.experience_years === '' ? 0 : Number(f.experience_years)
    if (!Number.isFinite(years) || years < 0 || years > 70) return setErr('Стаж — число от 0 до 70')
    setErr('')
    setSaving(true)
    const role = f.position.trim()
    const { data, error } = await updateProfile(profile.id, {
      full_name: f.full_name.trim(),
      position: role || null,
      specialty: role || null,
      dzo: f.dzo || null,
      region: f.region.trim() || null,
      bio: f.bio.trim() || null,
      telegram: cleanTelegram(f.telegram) || null,
      experience_years: years,
      skills: parseList(f.skills),
      equipment: parseList(f.equipment),
    })
    setSaving(false)
    if (error) return setErr(error)
    onSaved(data)
  }

  return (
    <Sheet
      title="Редактировать профиль"
      onClose={onClose}
      size="tall"
      footer={
        <Button variant="primary" size="lg" className="w-full" loading={saving} onClick={save}>
          Сохранить
        </Button>
      }
    >
      {err && (
        <div className="banner banner-error" role="alert">
          {err}
        </div>
      )}
      <TextField
        label="Полное имя"
        required
        value={f.full_name}
        onChange={set('full_name')}
        placeholder="Фамилия Имя Отчество"
      />
      <TextField
        label="Должность"
        value={f.position}
        onChange={set('position')}
        placeholder="Слесарь КИПиА, буровой мастер, технолог"
        hint="По ней вас находят в поиске экспертов"
      />
      <SelectField
        label="Предприятие"
        value={f.dzo}
        onChange={set('dzo')}
        options={dzoList}
        disabled={!dzoReady}
        placeholder={dzoReady ? '— не выбрано —' : 'Загружаем справочник…'}
      />
      <TextField
        label="Место работы"
        value={f.region}
        onChange={set('region')}
        placeholder="Рудник Орталык, Центральный офис"
      />
      <TextField
        label="Стаж, лет"
        type="number"
        min="0"
        max="70"
        inputMode="numeric"
        value={f.experience_years}
        onChange={set('experience_years')}
        placeholder="0"
      />
      <TextArea
        label="О себе"
        rows={4}
        value={f.bio}
        onChange={set('bio')}
        placeholder="Кратко об опыте и о том, чем можете помочь коллегам"
        maxLength={1000}
      />
      <TextField
        label="Навыки"
        hint="Через запятую"
        value={f.skills}
        onChange={set('skills')}
        placeholder="TIA Portal, Profibus, SCADA"
      />
      <TextField
        label="Оборудование"
        hint="Через запятую"
        value={f.equipment}
        onChange={set('equipment')}
        placeholder="Siemens S7-300, Burkert 8694"
      />
      <TextField
        label="Telegram"
        hint="Без символа @"
        value={f.telegram}
        onChange={set('telegram')}
        placeholder="username"
      />
    </Sheet>
  )
}
