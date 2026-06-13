import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { IconSearch, IconStar, IconBriefcase, IconLocation, IconClose, IconBack } from '../components/Icons'

const AVA_COLORS = ['#3A6BA8','#2E7D52','#8B5E1A','#5B3EA6','#7A3030','#1A6B6B','#4A6B1A','#6B1A5B']
const avaColor = (name) => AVA_COLORS[(name?.charCodeAt(0)||0) % AVA_COLORS.length]
const initials = (name) => (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()

const dzoCore = (dzo) => {
  if (!dzo) return ''
  return dzo.replace(/^(АО|ТОО|СП|ДП|ЗАО)\s*/gi,'')
    .replace(/«(СП|АО|ТОО|ДП)\s*/gi,'«').replace(/[«»""]/g,'')
    .replace(/\(.*?\)/g,'').trim()
}

export default function Search({ myId, onOpenProfile, onClose }) {
  const [query, setQuery]           = useState('')
  const [dzoQuery, setDzoQuery]     = useState('')
  const [dzoFilter, setDzoFilter]   = useState('')
  const [dzoList, setDzoList]       = useState([])
  const [dzoSuggestions, setDzoSuggestions] = useState([])
  const [showDzoDrop, setShowDzoDrop] = useState(false)
  const [results, setResults]       = useState([])
  const [counts, setCounts]         = useState({})
  const [loading, setLoading]       = useState(false)
  const inputRef = useRef(null)
  const dzoRef   = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    supabase.from('dzo_list').select('name').order('sort')
      .then(({ data }) => setDzoList((data||[]).map(d => d.name)))
  }, [])

  useEffect(() => {
    const w = dzoQuery.toLowerCase()
    setDzoSuggestions(w ? dzoList.filter(d=>d.toLowerCase().includes(w)) : dzoList)
  }, [dzoQuery, dzoList])

  useEffect(() => {
    const handler = (e) => {
      if (dzoRef.current && !dzoRef.current.contains(e.target)) setShowDzoDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim() && !dzoFilter) { setResults([]); setCounts({}); setLoading(false); return }
      setLoading(true)
      let q = supabase.from('profiles').select('*').limit(50).order('full_name')
      if (dzoFilter) q = q.eq('dzo', dzoFilter)
      if (query.trim()) q = q.or(`full_name.ilike.%${query.trim()}%,position.ilike.%${query.trim()}%,specialty.ilike.%${query.trim()}%`)
      const { data: rows } = await q
      let list = rows || []
      if (query.trim()) {
        const w = query.trim().toLowerCase()
        list = list.filter(r =>
          r.full_name?.toLowerCase().includes(w) ||
          r.position?.toLowerCase().includes(w) ||
          r.specialty?.toLowerCase().includes(w) ||
          (r.skills||[]).some(s=>s.toLowerCase().includes(w)) ||
          (r.equipment||[]).some(s=>s.toLowerCase().includes(w))
        )
      }
      setResults(list)
      if (list.length > 0) {
        const { data: pd } = await supabase.from('posts').select('author_id').in('author_id', list.map(r=>r.id))
        const cnt = {}
        for (const p of pd||[]) cnt[p.author_id] = (cnt[p.author_id]||0) + 1
        setCounts(cnt)
      } else setCounts({})
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query, dzoFilter])

  const selectDzo = (d) => { setDzoFilter(d); setDzoQuery(d); setShowDzoDrop(false) }
  const clearDzo  = () =>  { setDzoFilter(''); setDzoQuery(''); }

  return (
    <div className="search-overlay-inner">
      {/* Шапка */}
      <div className="search-overlay-header">
        <button className="icon-btn" onClick={onClose}><IconBack size={19}/></button>
        <div className="search-field" style={{ flex:1 }}>
          <IconSearch size={16} color="var(--text3)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Имя, должность, навык, оборудование..."
            autoComplete="off"
          />
          {query && <button className="clear-btn" onClick={()=>setQuery('')}><IconClose size={14}/></button>}
        </div>
      </div>

      {/* Фильтр ДЗО */}
      <div style={{ padding:'8px 16px', borderBottom:'1px solid var(--border)' }} ref={dzoRef}>
        <div className={`search-field ${dzoFilter?'has-value':''}`}>
          <IconLocation size={16} color={dzoFilter?'var(--accent)':'var(--text3)'} />
          <input
            value={dzoQuery}
            onChange={e=>{ setDzoQuery(e.target.value); setDzoFilter(''); setShowDzoDrop(true) }}
            onFocus={()=>setShowDzoDrop(true)}
            placeholder="Фильтр по ДЗО..."
            autoComplete="off"
          />
          {(dzoQuery||dzoFilter) && <button className="clear-btn" onClick={clearDzo}><IconClose size={14}/></button>}
        </div>

        {showDzoDrop && dzoSuggestions.length > 0 && (
          <div className="dzo-dropdown">
            {dzoSuggestions.map(d => (
              <div key={d} className={`dzo-option ${dzoFilter===d?'selected':''}`} onClick={()=>selectDzo(d)}>
                {d}
                {dzoFilter===d && <span className="dzo-check">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Активный фильтр */}
      {dzoFilter && (
        <div style={{ padding:'8px 16px' }}>
          <div className="active-filter">
            <span>{dzoFilter}</span>
            <button onClick={clearDzo}><IconClose size={12}/></button>
          </div>
        </div>
      )}

      {/* Результаты */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {loading && <div className="spinner" />}

        {!loading && results.length === 0 && (query || dzoFilter) && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Никого не нашли</div>
            <div className="empty-sub">Попробуйте другой запрос</div>
          </div>
        )}

        {!loading && !query && !dzoFilter && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Найдите эксперта</div>
            <div className="empty-sub">Введите имя, должность, навык или оборудование</div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="div-label">Найдено {results.length}</div>
        )}

        {results.map(p => (
          <div className="expert" key={p.id} onClick={() => onOpenProfile(p.id)}>
            <div className="ava" style={{ background:avaColor(p.full_name), width:46, height:46, fontSize:15, flexShrink:0 }}>
              {initials(p.full_name)}
            </div>
            <div className="exp-info">
              <div className="exp-name">
                {p.full_name}
                {p.is_expert && <IconStar size={12} active color="var(--gold)" />}
              </div>
              <div className="exp-meta-row">
                {(p.position||p.specialty) && (
                  <span className="exp-meta-item">
                    <IconBriefcase size={11} color="var(--text3)" />
                    {p.position||p.specialty}
                  </span>
                )}
                {p.dzo && (
                  <span className="exp-meta-item">
                    <IconLocation size={11} color="var(--text3)" />
                    {dzoCore(p.dzo)}
                  </span>
                )}
              </div>
              {p.skills?.length > 0 && (
                <div className="exp-chips">
                  {p.skills.slice(0,4).map(s => <span className="exp-chip" key={s}>{s}</span>)}
                </div>
              )}
            </div>
            {counts[p.id] > 0 && (
              <div className="exp-right">
                <div className="exp-stat-val">{counts[p.id]}</div>
                <div className="exp-stat-key">публ.</div>
              </div>
            )}
          </div>
        ))}
        <div style={{ height:40 }} />
      </div>
    </div>
  )
}
