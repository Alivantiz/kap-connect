import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { IconPlus, IconClose, IconCheck } from '../components/Icons'

const EMOJIS = ['⚙️','⛏️','🔬','🔧','⚡','🏔️','🏭','🏗️','⚒️','👷','🧪','🛢️','📡','💡','🔩','🛠️','📊','🌿','🚜','🏠']
const KINDS = [
  { value: 'specialty', label: 'По специальности' },
  { value: 'dzo',       label: 'По ДЗО' },
  { value: 'interest',  label: 'По интересам' },
]

export default function Communities({ myId }) {
  const [kind, setKind] = useState('all')
  const [comms, setComms] = useState(null)
  const [myMemberships, setMyMemberships] = useState(new Set())
  const [counts, setCounts] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const load = useCallback(async () => {
    let q = supabase.from('communities').select('*').order('created_at', { ascending: false })
    if (kind !== 'all') q = q.eq('kind', kind)
    const { data } = await q
    setComms(data || [])

    const { data: mem } = await supabase
      .from('community_members').select('community_id').eq('user_id', myId)
    setMyMemberships(new Set((mem || []).map(m => m.community_id)))

    const { data: allMem } = await supabase.from('community_members').select('community_id')
    const cnt = {}
    for (const m of allMem || []) cnt[m.community_id] = (cnt[m.community_id] || 0) + 1
    setCounts(cnt)
  }, [kind, myId])

  useEffect(() => { load() }, [load])

  const toggle = async (comm) => {
    const isIn = myMemberships.has(comm.id)
    const next = new Set(myMemberships)
    isIn ? next.delete(comm.id) : next.add(comm.id)
    setMyMemberships(next)
    setCounts(c => ({ ...c, [comm.id]: (c[comm.id] || 0) + (isIn ? -1 : 1) }))
    if (isIn) {
      await supabase.from('community_members').delete()
        .eq('community_id', comm.id).eq('user_id', myId)
    } else {
      await supabase.from('community_members').insert({ community_id: comm.id, user_id: myId })
    }
  }

  const handleDelete = async (comm) => {
    if (!window.confirm(`Удалить группу «${comm.name}»?`)) return
    await supabase.from('community_members').delete().eq('community_id', comm.id)
    await supabase.from('communities').delete().eq('id', comm.id)
    load()
  }

  const mine = comms?.filter(c => myMemberships.has(c.id)) || []
  const rest  = comms?.filter(c => !myMemberships.has(c.id)) || []

  return (
    <>
      <div className="comm-topbar">
        <div className="tabs" style={{flex:1, borderBottom:'none'}}>
          {[{v:'all',l:'Все'}, ...KINDS.map(k=>({v:k.value,l:k.label}))].map(({v,l}) => (
            <button key={v} className={`tab ${kind===v?'active':''}`} onClick={() => setKind(v)}>{l}</button>
          ))}
        </div>
        <button className="create-comm-btn" onClick={() => setShowCreate(true)}>
          <IconPlus size={16} /> Создать
        </button>
      </div>
      <div style={{height:1, background:'var(--border)'}} />

      {comms === null && <div className="spinner" />}

      {comms?.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">Нет сообществ</div>
          <div className="empty-sub">Создайте первое — объедините коллег по специальности, ДЗО или интересам.</div>
          <button className="btn-primary" style={{width:'auto',padding:'10px 24px',margin:'16px auto 0'}}
            onClick={() => setShowCreate(true)}>
            Создать сообщество
          </button>
        </div>
      )}

      {mine.length > 0 && <div className="div-label">Вы состоите</div>}
      {mine.map(c => (
        <CommCard key={c.id} c={c} isIn count={counts[c.id]||0}
          isOwner={c.creator_id === myId}
          onToggle={toggle} onEdit={()=>setEditTarget(c)} onDelete={()=>handleDelete(c)} />
      ))}

      {rest.length > 0 && <div className="div-label">{mine.length > 0 ? 'Другие группы' : 'Все группы'}</div>}
      {rest.map(c => (
        <CommCard key={c.id} c={c} isIn={false} count={counts[c.id]||0}
          isOwner={c.creator_id === myId}
          onToggle={toggle} onEdit={()=>setEditTarget(c)} onDelete={()=>handleDelete(c)} />
      ))}

      {showCreate && (
        <CommForm myId={myId} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load() }} />
      )}
      {editTarget && (
        <CommForm myId={myId} existing={editTarget}
          onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); load() }} />
      )}
    </>
  )
}

function CommCard({ c, isIn, count, isOwner, onToggle, onEdit, onDelete }) {
  const kindLabel = KINDS.find(k => k.value === c.kind)?.label || c.kind
  return (
    <div className="comm-card">
      <div className="comm-top">
        <div className="comm-emoji">{c.emoji || '👥'}</div>
        <div className="comm-info">
          <div className="comm-name">
            {c.name}
            {isOwner && <span className="owner-badge">Админ</span>}
          </div>
          <div className="comm-meta">
            {plural(count)} · {kindLabel}{c.is_closed ? ' · Закрытая' : ''}
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end'}}>
          <button className={`join-btn ${isIn ? 'in' : 'out'}`} onClick={() => onToggle(c)}>
            {isIn ? 'В группе' : 'Вступить'}
          </button>
          {isOwner && (
            <div style={{display:'flex', gap:6}}>
              <button className="comm-action-btn" onClick={onEdit}>✏️</button>
              <button className="comm-action-btn" onClick={onDelete}>🗑️</button>
            </div>
          )}
        </div>
      </div>
      {c.description && <div className="comm-desc">{c.description}</div>}
    </div>
  )
}

function CommForm({ myId, existing, onClose, onSaved }) {
  const [name, setName] = useState(existing?.name || '')
  const [desc, setDesc] = useState(existing?.description || '')
  const [emoji, setEmoji] = useState(existing?.emoji || '⚙️')
  const [kind, setKind] = useState(existing?.kind || 'specialty')
  const [closed, setClosed] = useState(existing?.is_closed || false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!name.trim()) { setError('Введите название группы'); return }
    setSaving(true)
    if (existing) {
      const { error: e } = await supabase.from('communities').update({
        name: name.trim(), description: desc.trim() || null,
        emoji, kind, is_closed: closed,
      }).eq('id', existing.id)
      if (e) { setError(e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase.from('communities').insert({
        name: name.trim(), description: desc.trim() || null,
        emoji, kind, is_closed: closed, creator_id: myId,
      })
      if (e) { setError(e.message); setSaving(false); return }
    }
    // автовступление при создании
    if (!existing) {
      const { data: newComm } = await supabase.from('communities')
        .select('id').eq('name', name.trim()).eq('creator_id', myId).single()
      if (newComm) {
        await supabase.from('community_members').insert({ community_id: newComm.id, user_id: myId })
      }
    }
    setSaving(false)
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          {existing ? 'Редактировать группу' : 'Новая группа'}
          <button className="icon-btn" onClick={onClose}><IconClose size={18} /></button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* Эмодзи пикер */}
        <div className="field">
          <label>Иконка</label>
          <div className="emoji-picker">
            {EMOJIS.map(e => (
              <button key={e} className={`emoji-opt ${emoji===e?'sel':''}`} onClick={() => setEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Название</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="КИПиА Казатомпром, Буровики Инкай..." />
        </div>

        <div className="field">
          <label>Описание <span style={{fontWeight:400,textTransform:'none'}}>(необязательно)</span></label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="О чём эта группа, кому она будет полезна..." />
        </div>

        <div className="field">
          <label>Тип</label>
          <div className="type-row">
            {KINDS.map(k => (
              <button key={k.value} className={`type-opt ${kind===k.value?'sel':''}`}
                onClick={() => setKind(k.value)}>
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
            <div className={`toggle ${closed?'on':''}`} onClick={() => setClosed(!closed)}>
              <div className="toggle-thumb" />
            </div>
            Закрытая группа
            <span style={{fontWeight:400,color:'var(--text3)'}}>
              {closed ? '— вступление по запросу' : '— открытая для всех'}
            </span>
          </label>
        </div>

        <button className="btn-primary" style={{margin:'4px 0 0',width:'100%'}}
          disabled={saving} onClick={save}>
          {saving ? 'Сохраняем...' : existing ? 'Сохранить' : 'Создать группу'}
        </button>
      </div>
    </div>
  )
}

function plural(n) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return n + ' участник'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return n + ' участника'
  return n + ' участников'
}
