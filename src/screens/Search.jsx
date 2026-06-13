import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IconSearch, IconStar, IconWrench, IconBriefcase, IconLocation } from '../components/Icons'

const AVA_COLORS = ['#3A6BA8','#2E7D52','#8B5E1A','#5B3EA6','#7A3030','#1A6B6B','#4A6B1A','#6B1A5B']
const avaColor = (name) => AVA_COLORS[(name?.charCodeAt(0)||0) % AVA_COLORS.length]
const initials = (name) => (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
const dzoShort = (dzo) => dzo?.replace(/^(АО|ТОО|СП|ДП)\s*[«"]/i,'').replace(/[»"]/g,'').trim().split(' ')[0] || dzo

export default function Search({onOpenProfile}) {
  const [query, setQuery]         = useState('')
  const [dzoFilter, setDzoFilter] = useState('')
  const [dzoList, setDzoList]     = useState([])
  const [results, setResults]     = useState([])
  const [counts, setCounts]       = useState({})
  const [loading, setLoading]     = useState(false)

  useEffect(()=>{
    supabase.from('dzo_list').select('name').order('sort')
      .then(({data})=>setDzoList((data||[]).map(d=>d.name)))
  },[])

  useEffect(()=>{
    const t = setTimeout(async ()=>{
      setLoading(true)
      let q = supabase.from('profiles').select('*').limit(50).order('full_name')
      if (dzoFilter) q = q.eq('dzo',dzoFilter)
      if (query.trim()) {
        const w=query.trim()
        q = q.or(`full_name.ilike.%${w}%,specialty.ilike.%${w}%,position.ilike.%${w}%`)
      }
      const {data:rows} = await q
      let list = rows||[]
      if (query.trim()) {
        const w=query.trim().toLowerCase()
        list = list.filter(r=>
          r.full_name?.toLowerCase().includes(w)||
          r.specialty?.toLowerCase().includes(w)||
          r.position?.toLowerCase().includes(w)||
          (r.skills||[]).some(s=>s.toLowerCase().includes(w))||
          (r.equipment||[]).some(s=>s.toLowerCase().includes(w))
        )
      }
      setResults(list)
      if (list.length>0) {
        const {data:postData} = await supabase.from('posts').select('author_id').in('author_id',list.map(r=>r.id))
        const cnt={}
        for (const p of postData||[]) cnt[p.author_id]=(cnt[p.author_id]||0)+1
        setCounts(cnt)
      }
      setLoading(false)
    },300)
    return ()=>clearTimeout(t)
  },[query, dzoFilter])

  return (
    <>
      <div className="screen-header">
        <div className="screen-title">Поиск</div>
      </div>

      <div className="search-wrap">
        <div className="search-field">
          <IconSearch size={17} color="var(--text3)"/>
          <input value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Имя, специальность, навык, оборудование..."
            autoComplete="off"/>
          {query && (
            <button style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:0,fontSize:16}}
              onClick={()=>setQuery('')}>×</button>
          )}
        </div>
      </div>

      {/* Фильтр по ДЗО — скроллируемые табы (их много) */}
      <div className="tabs-scroll">
        <button className={`tab ${!dzoFilter?'active':''}`} onClick={()=>setDzoFilter('')}>Все</button>
        {dzoList.map(d=>(
          <button key={d} className={`tab ${dzoFilter===d?'active':''}`}
            onClick={()=>setDzoFilter(dzoFilter===d?'':d)}>
            {dzoShort(d)}
          </button>
        ))}
      </div>

      {loading && <div className="spinner"/>}

      {!loading && results.length===0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">
            {query||dzoFilter ? 'Никого не нашли' : 'Найдите эксперта'}
          </div>
          <div className="empty-sub">
            {query||dzoFilter
              ? 'Попробуйте другой запрос или уберите фильтр'
              : 'Введите имя, специальность или навык'}
          </div>
        </div>
      )}

      {!loading && results.length>0 && (
        <div className="div-label">Найдено {results.length} специалистов</div>
      )}

      {results.map(p=>(
        <div className="expert" key={p.id} onClick={()=>onOpenProfile(p.id)}>
          <div className="ava" style={{background:avaColor(p.full_name),width:46,height:46,fontSize:15}}>
            {initials(p.full_name)}
          </div>
          <div className="exp-info">
            <div className="exp-name">
              {p.full_name}
              {p.is_expert && <IconStar size={12} active color="var(--gold)"/>}
            </div>
            <div className="exp-meta-row">
              {(p.position||p.specialty) && (
                <span className="exp-meta-item">
                  <IconBriefcase size={11} color="var(--text3)"/>
                  {p.position||p.specialty}
                </span>
              )}
              {p.dzo && (
                <span className="exp-meta-item">
                  <IconLocation size={11} color="var(--text3)"/>
                  {dzoShort(p.dzo)}
                </span>
              )}
            </div>
            {p.skills?.length>0 && (
              <div className="exp-chips">
                {p.skills.slice(0,4).map(s=><span className="exp-chip" key={s}>{s}</span>)}
              </div>
            )}
          </div>
          {counts[p.id]>0 && (
            <div className="exp-right">
              <div className="exp-stat-val">{counts[p.id]}</div>
              <div className="exp-stat-key">публ.</div>
            </div>
          )}
        </div>
      ))}

      <div style={{height:80}}/>
    </>
  )
}
