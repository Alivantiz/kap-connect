import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IconBack, IconStar, IconTelegram, IconLogout, IconClose, IconWrench, IconBriefcase, IconLocation } from '../components/Icons'

const AVA_COLORS = ['#3A6BA8', '#2E7D52', '#8B5E1A', '#5B3EA6', '#7A3030', '#1A6B6B', '#4A6B1A', '#6B1A5B']
const avaColor  = (name) => AVA_COLORS[(name?.charCodeAt(0) || 0) % AVA_COLORS.length]
const initials  = (name) => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

export default function Profile({ profileId, isMe, onBack, myProfile, onProfileSaved }) {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ posts: 0, answers: 0 })
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setProfile(null)
    supabase.from('profiles').select('*').eq('id', profileId).single()
      .then(({ data }) => setProfile(data))

    Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', profileId),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', profileId),
    ]).then(([p, c]) => setStats({ posts: p.count || 0, answers: c.count || 0 }))
  }, [profileId])

  if (!profile) return <div className="spinner" />

  const dzoShort = (dzo) =>
    dzo?.replace(/^(АО|ТОО|СП|ДП)\s*[«"]?/i, '').replace(/[»"]/g, '').trim() || dzo

  return (
    <>
      <div className="profile-header">
        {onBack && (
          <button className="icon-btn" style={{marginBottom: 12}} onClick={onBack}>
            <IconBack size={19} />
          </button>
        )}
        <div className="profile-row">
          <div className="profile-ava" style={{background: avaColor(profile.full_name)}}>
            {initials(profile.full_name)}
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <div className="profile-name">{profile.full_name}</div>
            {profile.position && (
              <div className="profile-role">{profile.position}</div>
            )}
            <div className="profile-dzo-row">
              {profile.dzo && (
                <span className="profile-meta-item">
                  <IconLocation size={11} color="var(--text3)" />
                  {dzoShort(profile.dzo)}
                </span>
              )}
              {profile.specialty && (
                <span className="profile-meta-item">
                  <IconBriefcase size={11} color="var(--text3)" />
                  {profile.specialty}
                </span>
              )}
            </div>
            {profile.is_expert && (
              <div className="expert-pill">
                <IconStar size={12} active /> Эксперт
                {profile.specialty ? ` · ${profile.specialty}` : ''}
              </div>
            )}
          </div>
        </div>

        <div className="profile-stats">
          <div className="pstat">
            <div className="pstat-val">{stats.posts}</div>
            <div className="pstat-key">публикаций</div>
          </div>
          <div className="pstat">
            <div className="pstat-val">{stats.answers}</div>
            <div className="pstat-key">ответов</div>
          </div>
          <div className="pstat">
            <div className="pstat-val">{profile.experience_years || '—'}</div>
            <div className="pstat-key">лет стажа</div>
          </div>
          <div className="pstat">
            <div className="pstat-val" style={{fontSize: profile.region ? 13 : 18}}>
              {profile.region ? profile.region.split(' ')[0] : '—'}
            </div>
            <div className="pstat-key">регион</div>
          </div>
        </div>
      </div>

      {profile.bio && (
        <div className="profile-section">
          <div className="ps-label">О себе</div>
          <div className="bio-text">{profile.bio}</div>
        </div>
      )}

      {profile.skills?.length > 0 && (
        <div className="profile-section">
          <div className="ps-label">Навыки</div>
          <div className="skill-wrap">
            {profile.skills.map((s, i) => (
              <span className={`skill ${i < 3 ? 'hi' : ''}`} key={s}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {profile.equipment?.length > 0 && (
        <div className="profile-section">
          <div className="ps-label">Оборудование</div>
          <div className="skill-wrap">
            {profile.equipment.map(s => (
              <span className="skill" key={s}>
                <IconWrench size={11} color="var(--text3)" /> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Пустой профиль — подсказка заполнить */}
      {isMe && !profile.position && !profile.bio && (profile.skills?.length || 0) === 0 && (
        <div className="profile-section">
          <div style={{
            background: 'rgba(74,144,217,0.08)',
            border: '1px dashed rgba(74,144,217,0.3)',
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 13,
            color: 'var(--text3)',
            lineHeight: 1.5,
          }}>
            💡 Заполните профиль — укажите должность, навыки и оборудование.
            Так коллеги из других ДЗО смогут найти вас через поиск.
          </div>
        </div>
      )}

      {!isMe && profile.telegram && (
        <a
          className="btn-primary"
          style={{textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}
          href={`https://t.me/${profile.telegram.replace('@', '')}`}
          target="_blank"
          rel="noreferrer"
        >
          <IconTelegram size={18} /> Написать в Telegram
        </a>
      )}

      {isMe && (
        <>
          <button className="btn-primary" onClick={() => setEditing(true)}>
            Редактировать профиль
          </button>
          <button
            className="btn-ghost"
            style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}
            onClick={() => supabase.auth.signOut()}
          >
            <IconLogout size={16} /> Выйти
          </button>
        </>
      )}

      <div style={{height: 20}} />

      {editing && (
        <EditProfile
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(p) => { setProfile(p); onProfileSaved?.(p); setEditing(false) }}
        />
      )}
    </>
  )
}

const DZO_LIST_FALLBACK = ['Орталык', 'Инкай', 'Байкен-У', 'Катко']

function EditProfile({ profile, onClose, onSaved }) {
  const [dzoList, setDzoList] = useState([])

  // Загружаем список ДЗО из БД
  useEffect(() => {
    supabase.from('dzo_list').select('name').order('sort')
      .then(({ data }) => setDzoList((data || []).map(d => d.name)))
  }, [])

  // Поля заполнены текущими данными профиля
  const [f, setF] = useState({
    full_name:        profile.full_name || '',
    position:         profile.position || '',
    dzo:              profile.dzo || '',
    region:           profile.region || '',
    specialty:        profile.specialty || '',
    experience_years: profile.experience_years || '',
    bio:              profile.bio || '',
    skills:           (profile.skills || []).join(', '),
    equipment:        (profile.equipment || []).join(', '),
    telegram:         profile.telegram || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }))

  const save = async () => {
    if (!f.full_name.trim()) { setError('Имя обязательно'); return }
    setSaving(true)
    const upd = {
      ...f,
      full_name:        f.full_name.trim(),
      position:         f.position.trim() || null,
      region:           f.region.trim() || null,
      specialty:        f.specialty.trim() || null,
      bio:              f.bio.trim() || null,
      telegram:         f.telegram.trim().replace('@', '') || null,
      experience_years: parseInt(f.experience_years) || 0,
      skills:           f.skills.split(',').map(s => s.trim()).filter(Boolean),
      equipment:        f.equipment.split(',').map(s => s.trim()).filter(Boolean),
    }
    const { data, error: e } = await supabase
      .from('profiles').update(upd).eq('id', profile.id).select().single()
    setSaving(false)
    if (e) { setError(e.message); return }
    if (data) onSaved(data)
  }

  const list = dzoList.length > 0 ? dzoList : DZO_LIST_FALLBACK

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Редактировать профиль
          <button className="icon-btn" onClick={onClose}><IconClose size={18} /></button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="field">
          <label>Полное имя</label>
          <input value={f.full_name} onChange={set('full_name')} placeholder="Фамилия Имя Отчество" />
        </div>
        <div className="field">
          <label>Должность</label>
          <input value={f.position} onChange={set('position')} placeholder="Например: Слесарь КИПиА 5-го разряда" />
        </div>
        <div className="field">
          <label>ДЗО</label>
          <select value={f.dzo} onChange={set('dzo')}>
            <option value="">— выберите ДЗО —</option>
            {list.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Регион</label>
          <input value={f.region} onChange={set('region')} placeholder="Например: Туркестанская обл." />
        </div>
        <div className="field">
          <label>Специальность</label>
          <input value={f.specialty} onChange={set('specialty')} placeholder="Например: КИПиА, буровик, механик" />
        </div>
        <div className="field">
          <label>Стаж (лет)</label>
          <input type="number" min="0" max="60" value={f.experience_years} onChange={set('experience_years')} placeholder="0" />
        </div>
        <div className="field">
          <label>О себе</label>
          <textarea value={f.bio} onChange={set('bio')} placeholder="Кратко о вашем опыте и чем можете помочь коллегам" />
        </div>
        <div className="field">
          <label>
            Навыки{' '}
            <span style={{fontWeight:400, color:'var(--text3)'}}>через запятую</span>
          </label>
          <input value={f.skills} onChange={set('skills')} placeholder="TIA Portal, Profibus, SCADA" />
        </div>
        <div className="field">
          <label>
            Оборудование{' '}
            <span style={{fontWeight:400, color:'var(--text3)'}}>через запятую</span>
          </label>
          <input value={f.equipment} onChange={set('equipment')} placeholder="Siemens S7-300, Burkert 8694" />
        </div>
        <div className="field">
          <label>Telegram <span style={{fontWeight:400, color:'var(--text3)'}}>без @</span></label>
          <input value={f.telegram} onChange={set('telegram')} placeholder="username" />
        </div>

        <button
          className="btn-primary"
          style={{margin: '4px 0 0', width: '100%'}}
          disabled={saving}
          onClick={save}
        >
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
        <div style={{height: 8}} />
      </div>
    </div>
  )
}
