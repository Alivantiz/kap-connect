// Общие форматтеры. Раньше эти функции были скопированы в шесть экранов,
// причём с расхождениями: dzoCore в ленте обрезал до двух слов, а в профиле нет.

/** Детерминированный хеш строки (FNV-1a). */
const hash = (str) => {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Палитра аватаров. Раньше цвет брался по первой букве имени —
 * все Ахметовы и Абдуллаевы получали один и тот же. Теперь хешируется
 * имя целиком, и соседние строки в списке визуально различаются.
 */
export const AVA_COLORS = [
  '#3E6FA8',
  '#2E7D57',
  '#9A6318',
  '#5E45A6',
  '#8C3742',
  '#1C6E70',
  '#4F6B1E',
  '#7A3468',
  '#2F5F8F',
  '#6B5B23',
]

export const avaColor = (name) => AVA_COLORS[hash(String(name || '?')) % AVA_COLORS.length]

/** «Ахметов Ерлан Серикович» → «АЕ» */
export const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'

/**
 * Убирает юридические приставки и кавычки.
 * «АО «СП «Инкай»» → «Инкай»; «Головной офис (АО НАК Казатомпром)» → «Головной офис»
 * maxWords ограничивает длину там, где место в вёрстке ограничено.
 */
export const dzoCore = (dzo, maxWords = 0) => {
  if (!dzo) return ''
  const core = String(dzo)
    .replace(/\(.*?\)/g, '')
    .replace(/(^|[«"\s])(АО|ТОО|СП|ДП|ЗАО)[\s»"]*/gi, '$1')
    .replace(/[«»“”„"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!maxWords) return core
  return core.split(' ').slice(0, maxWords).join(' ')
}

const ROLE_SHORT = {
  слесарь: 'Слесарь',
  инженер: 'Инж.',
  техник: 'Техник',
  оператор: 'Оператор',
  мастер: 'Мастер',
  начальник: 'Нач.',
  специалист: 'Спец.',
  машинист: 'Машинист',
  электромонтёр: 'Электрик',
  электромонтер: 'Электрик',
}

/** Короткая подпись специальности для узкой кнопки фильтра. */
export const specShort = (position, specialty) => {
  const raw = String(specialty || position || '').trim()
  if (!raw) return 'Профессия'
  if (raw.length <= 10) return raw
  const cleaned = raw
    .replace(/^(главный|старший|ведущий|младший)\s+/i, '')
    .replace(
      /^(слесарь|инженер|техник|оператор|мастер|начальник|специалист|машинист|электромонт[её]р)\s+/i,
      (_, w) => `${ROLE_SHORT[w.toLowerCase()] || w} `,
    )
    .trim()
  return cleaned.length > 12 ? `${cleaned.slice(0, 11)}…` : cleaned
}

const MINUTE = 60
const HOUR = 3600
const DAY = 86400
const WEEK = 604800

/** «сейчас» / «5 мин» / «3 ч» / «2 дн» / «14 мар» */
export const timeAgo = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const s = (Date.now() - d.getTime()) / 1000
  if (s < 0) return 'сейчас'
  if (s < MINUTE) return 'сейчас'
  if (s < HOUR) return `${Math.floor(s / MINUTE)} мин`
  if (s < DAY) return `${Math.floor(s / HOUR)} ч`
  if (s < WEEK) return `${Math.floor(s / DAY)} дн`
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' })
}

export const timeExact = (iso) =>
  new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

export const dateLabel = (iso) => {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(Date.now() - DAY * 1000)
  const same = (a, b) => a.toDateString() === b.toDateString()
  if (same(d, today)) return 'Сегодня'
  if (same(d, yesterday)) return 'Вчера'
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'long' })
}

/** «5 ответов» — русские окончания по числу. */
export const plural = (n, one, few, many) => {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last > 1 && last < 5) return few
  if (last === 1) return one
  return many
}

export const countLabel = (n, one, few, many) => `${n} ${plural(n, one, few, many)}`

/** «TIA Portal, Profibus,, SCADA » → ['TIA Portal','Profibus','SCADA'] без дублей */
export const parseList = (raw) => {
  const seen = new Set()
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false
      const k = s.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
}

export const truncate = (s, n) => (!s || s.length <= n ? s || '' : `${s.slice(0, n).trimEnd()}…`)

/** Telegram-логин без @ и без адреса, чтобы ссылка не ломалась. */
export const cleanTelegram = (raw) =>
  String(raw || '')
    .trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')
    .replace(/^@+/, '')
    .replace(/[^A-Za-z0-9_]/g, '')

export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim())
