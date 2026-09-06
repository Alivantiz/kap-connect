import { useEffect, useRef, useState } from 'react'
import { listDzo, searchProfiles } from '../lib/db'
import { dzoCore } from '../lib/format'
import {
  IconBack,
  IconClose,
  IconEmptySearch,
  IconLocation,
  IconSearch,
  IconBriefcase,
  IconChevronDown,
} from '../components/Icons'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import { RowSkeleton } from '../components/ui/Skeleton'

const SUGGESTIONS = ['КИПиА', 'бурение', 'Siemens', 'SCADA', 'насосы', 'сорбция', 'геология']

export default function Search({ onOpenProfile, onClose }) {
  const [query, setQuery] = useState('')
  const [dzoFilter, setDzoFilter] = useState('')
  const [dzoList, setDzoList] = useState([])
  const [dzoOpen, setDzoOpen] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const dropRef = useRef(null)
  const reqId = useRef(0)

  useEffect(() => {
    inputRef.current?.focus()
    listDzo().then(({ data }) => data && setDzoList(data))
  }, [])

  useEffect(() => {
    const onDown = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDzoOpen(false)
    }
    const onEsc = (e) => e.key === 'Escape' && (dzoOpen ? setDzoOpen(false) : onClose())
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [dzoOpen, onClose])

  useEffect(() => {
    const q = query.trim()
    if (!q && !dzoFilter) {
      setResults(null)
      setLoading(false)
      setError('')
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      // Ответ на устаревший запрос не должен перетирать свежий:
      // при быстром наборе результаты раньше «прыгали» назад.
      const id = ++reqId.current
      const { data, error: e } = await searchProfiles(q, dzoFilter)
      if (id !== reqId.current) return
      setLoading(false)
      if (e) {
        setError(e)
        setResults([])
        return
      }
      setError('')
      setResults(data || [])
    }, 280)
    return () => clearTimeout(timer)
  }, [query, dzoFilter])

  const clearAll = () => {
    setQuery('')
    setDzoFilter('')
    inputRef.current?.focus()
  }

  return (
    <div className="overlay-screen">
      <header className="overlay-head">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть поиск">
          <IconBack size={19} />
        </button>
        <div className="search-box">
          <IconSearch size={16} />
          <input
            ref={inputRef}
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Имя, должность, навык, оборудование"
            aria-label="Поиск сотрудников"
            autoComplete="off"
            type="search"
          />
          {query && (
            <button
              type="button"
              className="icon-btn icon-btn-sm"
              onClick={() => setQuery('')}
              aria-label="Очистить"
            >
              <IconClose size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="search-filter" ref={dropRef}>
        <button
          type="button"
          className={`dzo-trigger ${dzoFilter ? 'dzo-trigger-on' : ''}`}
          onClick={() => setDzoOpen((v) => !v)}
          aria-expanded={dzoOpen}
          aria-haspopup="listbox"
        >
          <IconLocation size={15} />
          <span>{dzoFilter ? dzoCore(dzoFilter) : 'Все предприятия'}</span>
          <IconChevronDown size={15} />
        </button>
        {dzoFilter && (
          <button type="button" className="chip chip-clear" onClick={() => setDzoFilter('')}>
            <IconClose size={11} /> Сбросить
          </button>
        )}

        {dzoOpen && (
          <div className="dropdown" role="listbox">
            <button
              type="button"
              role="option"
              aria-selected={!dzoFilter}
              className={`dropdown-opt ${!dzoFilter ? 'dropdown-opt-on' : ''}`}
              onClick={() => {
                setDzoFilter('')
                setDzoOpen(false)
              }}
            >
              Все предприятия
            </button>
            {dzoList.map((d) => (
              <button
                key={d}
                type="button"
                role="option"
                aria-selected={dzoFilter === d}
                className={`dropdown-opt ${dzoFilter === d ? 'dropdown-opt-on' : ''}`}
                onClick={() => {
                  setDzoFilter(d)
                  setDzoOpen(false)
                }}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overlay-body">
        {loading && <RowSkeleton count={4} />}

        {!loading && results === null && (
          <>
            <EmptyState
              icon={IconEmptySearch}
              title="Найдите эксперта"
              text="Ищет по имени, должности, навыкам и оборудованию по всем предприятиям группы."
            />
            <div className="sugg">
              <div className="sugg-label">Частые запросы</div>
              <div className="chips">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="chip chip-btn"
                    onClick={() => setQuery(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {!loading && error && (
          <EmptyState icon={IconEmptySearch} title="Поиск не сработал" text={error} />
        )}

        {!loading && !error && results?.length === 0 && (
          <EmptyState
            icon={IconEmptySearch}
            title="Никого не нашли"
            text="Попробуйте другой запрос или снимите фильтр по предприятию."
            action={
              <button type="button" className="link" onClick={clearAll}>
                Сбросить поиск
              </button>
            }
          />
        )}

        {!loading && results?.length > 0 && (
          <div className="list-label">Найдено: {results.length}</div>
        )}

        {!loading &&
          results?.map((p) => {
            const role = p.position || p.specialty
            return (
              <button
                type="button"
                className="person"
                key={p.id}
                onClick={() => onOpenProfile(p.id)}
              >
                <Avatar name={p.full_name} size={46} expert={p.is_expert} />
                <span className="person-info">
                  <span className="person-name">{p.full_name}</span>
                  <span className="person-meta">
                    {role && (
                      <span>
                        <IconBriefcase size={11} /> {role}
                      </span>
                    )}
                    {p.dzo && (
                      <span>
                        <IconLocation size={11} /> {dzoCore(p.dzo, 2)}
                      </span>
                    )}
                  </span>
                  {p.skills?.length > 0 && (
                    <span className="chips chips-sm">
                      {p.skills.slice(0, 4).map((s, i) => (
                        <span className="chip" key={`${s}-${i}`}>
                          {s}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}
