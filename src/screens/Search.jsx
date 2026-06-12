import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IconSearch, IconStar } from '../components/Icons'

const AVA_COLORS = ['#3A6BA8', '#2E7D52', '#8B5E1A', '#5B3EA6', '#8B2020', '#1A6B6B']
const avaColor = (name) => AVA_COLORS[(name?.charCodeAt(0) || 0) % AVA_COLORS.length]
const initials = (name) => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

export default function Search({ onOpenProfile }) {
  const [query, setQuery] = useState('')
  const [dzoFilter, setDzoFilter] = useState('')
  const [dzoList, setDzoList] = useState([])
  const [results, setResults] = useState(null)

  // collect distinct DZOs for filter tabs
  useEffect(() => {
    supabase.from('profiles').select('dzo').not('dzo', 'is', null)
      .then(({ data }) => {
        const uniq = [...new Set((data || []).map(d => d.dzo))].sort()
        setDzoList(uniq)
      })
  }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      let q = supabase.from('profiles').select('*').limit(40)
      if (dzoFilter) q = q.eq('dzo', dzoFilter)
      if (query.trim()) {
        const w = query.trim()
        // имя ИЛИ специальность ИЛИ навык ИЛИ оборудование
        q = q.or(`full_name.ilike.%${w}%,specialty.ilike.%${w}%,position.ilike.%${w}%`)
      }
      const { data } = await q
      let rows = data || []
      // дополнительный поиск по массивам skills/equipment на клиенте
      if (query.trim()) {
        const w = query.trim().toLowerCase()
        const { data: bySkill } = await supabase.from('profiles').select('*')
          .or(`skills.cs.{${query.trim()}},equipment.cs.{${query.trim()}}`)
          .limit(40)
        const seen = new Set(rows.map(r => r.id))
        for (const r of bySkill || []) {
          if (!seen.has(r.id) && (!dzoFilter || r.dzo === dzoFilter)) rows.push(r)
        }
        // и частичное совпадение в массивах
        rows = rows.filter(r =>
          r.full_name?.toLowerCase().includes(w) ||
          r.specialty?.toLowerCase().includes(w) ||
          r.position?.toLowerCase().includes(w) ||
          (r.skills || []).some(s => s.toLowerCase().includes(w)) ||
          (r.equipment || []).some(s => s.toLowerCase().includes(w))
        )
      }
      setResults(rows)
    }, 300)
    return () => clearTimeout(t)
  }, [query, dzoFilter])

  return (
    <>
      <div className="search-wrap">
        <div className="search-field">
          <IconSearch size={17} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Имя, специальность, навык, оборудование..."
          />
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${!dzoFilter?'active':''}`} onClick={() => setDzoFilter('')}>Все ДЗО</button>
        {dzoList.map(d => (
          <button key={d} className={`tab ${dzoFilter===d?'active':''}`} onClick={() => setDzoFilter(d)}>{d}</button>
        ))}
      </div>

      {results === null && <div className="spinner" />}
      {results?.length === 0 && (
        <div className="empty">Никого не нашли.<br />Попробуйте другой запрос.</div>
      )}

      {results?.length > 0 && (
        <div className="div-label">Найдено: {results.length}</div>
      )}

      {results?.map(p => (
        <div className="expert" key={p.id} onClick={() => onOpenProfile(p.id)}>
          <div className="ava" style={{ background: avaColor(p.full_name), width: 44, height: 44 }}>
            {initials(p.full_name)}
          </div>
          <div className="exp-info">
            <div className="exp-name">
              {p.full_name}
              {p.is_expert && <IconStar size={13} active color="var(--gold)" style={{marginLeft:5}} />}
            </div>
            <div className="exp-role">
              {[p.specialty || p.position, p.dzo, p.region].filter(Boolean).join(' · ')}
            </div>
            {(p.skills?.length > 0) && (
              <div className="exp-chips">
                {p.skills.slice(0, 4).map(s => <span className="exp-chip" key={s}>{s}</span>)}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  )
}
