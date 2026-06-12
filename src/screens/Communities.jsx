import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export default function Communities({ myId }) {
  const [kind, setKind] = useState('all') // all | specialty | dzo
  const [comms, setComms] = useState(null)
  const [myMemberships, setMyMemberships] = useState(new Set())
  const [counts, setCounts] = useState({})

  const load = useCallback(async () => {
    let q = supabase.from('communities').select('*').order('name')
    if (kind !== 'all') q = q.eq('kind', kind)
    const { data } = await q
    setComms(data || [])

    const { data: mem } = await supabase.from('community_members')
      .select('community_id').eq('user_id', myId)
    setMyMemberships(new Set((mem || []).map(m => m.community_id)))

    // counts
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

  const mine = comms?.filter(c => myMemberships.has(c.id)) || []
  const rest = comms?.filter(c => !myMemberships.has(c.id)) || []

  return (
    <>
      <div className="tabs">
        <button className={`tab ${kind==='all'?'active':''}`} onClick={() => setKind('all')}>Все</button>
        <button className={`tab ${kind==='specialty'?'active':''}`} onClick={() => setKind('specialty')}>По специальности</button>
        <button className={`tab ${kind==='dzo'?'active':''}`} onClick={() => setKind('dzo')}>По ДЗО</button>
      </div>

      {comms === null && <div className="spinner" />}

      {mine.length > 0 && <div className="div-label">Вы состоите</div>}
      {mine.map(c => <CommCard key={c.id} c={c} isIn count={counts[c.id] || 0} onToggle={toggle} />)}

      {rest.length > 0 && <div className="div-label">{mine.length > 0 ? 'Рекомендуем' : 'Сообщества'}</div>}
      {rest.map(c => <CommCard key={c.id} c={c} isIn={false} count={counts[c.id] || 0} onToggle={toggle} />)}
    </>
  )
}

function CommCard({ c, isIn, count, onToggle }) {
  return (
    <div className="comm-card">
      <div className="comm-top">
        <div className="comm-emoji">{c.emoji}</div>
        <div className="comm-info">
          <div className="comm-name">{c.name}</div>
          <div className="comm-meta">
            {count} {plural(count)} {c.is_closed ? '· Закрытая' : ''}
          </div>
        </div>
        <button className={`join-btn ${isIn ? 'in' : 'out'}`} onClick={() => onToggle(c)}>
          {isIn ? 'В группе' : 'Вступить'}
        </button>
      </div>
      {c.description && <div className="comm-desc">{c.description}</div>}
    </div>
  )
}

function plural(n) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'участник'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'участника'
  return 'участников'
}
