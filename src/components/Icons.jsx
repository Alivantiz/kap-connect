// KAP Connect — кастомный набор иконок
// Единый стиль: stroke 1.7, скруглённые концы, viewBox 24x24
// Логотип — гексагон (атомная отрасль) с узлами связи

const base = {
  fill: 'none',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const Svg = ({ size = 22, color = 'currentColor', children, filled }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    stroke={color}
    fill={filled ? color : 'none'}
    {...base}
  >
    {children}
  </svg>
)

// ── ЛОГОТИП: гексагон + 3 узла связи ──
export const Logo = ({ size = 28, color = '#4A90D9' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path
      d="M16 3 L27 9.5 V22.5 L16 29 L5 22.5 V9.5 Z"
      stroke={color} strokeWidth="2" strokeLinejoin="round"
    />
    <circle cx="16" cy="11" r="2.2" fill={color} />
    <circle cx="11" cy="19" r="2.2" fill={color} />
    <circle cx="21" cy="19" r="2.2" fill={color} />
    <path d="M16 13 L11.8 17.2 M16 13 L20.2 17.2 M13 19 L19 19"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// ── НАВИГАЦИЯ ──

// Лента: гексагон с горизонтальными линиями (поток контента)
export const IconFeed = (p) => (
  <Svg {...p}>
    <path d="M12 2.5 L20.5 7.25 V16.75 L12 21.5 L3.5 16.75 V7.25 Z" />
    <path d="M8 9.5 h8 M8 12 h8 M8 14.5 h5" />
  </Svg>
)

// Поиск: лупа с узлом в центре (поиск человека)
export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <circle cx="10.5" cy="10.5" r="1.6" fill="currentColor" stroke="none" />
    <path d="M15.5 15.5 L21 21" />
  </Svg>
)

// Группы: три связанных узла
export const IconGroups = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="6" r="2.6" />
    <circle cx="5.5" cy="17" r="2.6" />
    <circle cx="18.5" cy="17" r="2.6" />
    <path d="M10.6 8.2 L6.9 14.8 M13.4 8.2 L17.1 14.8 M8.1 17 H15.9" />
  </Svg>
)

// Профиль: человек в гексагоне
export const IconProfile = (p) => (
  <Svg {...p}>
    <path d="M12 2.5 L20.5 7.25 V16.75 L12 21.5 L3.5 16.75 V7.25 Z" />
    <circle cx="12" cy="10" r="2.5" />
    <path d="M7.5 17.5 c0-2.5 2-4 4.5-4 s4.5 1.5 4.5 4" />
  </Svg>
)

// ── ДЕЙСТВИЯ ──

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5 V19 M5 12 H19" />
  </Svg>
)

export const IconHeart = ({ active, ...p }) => (
  <Svg {...p} filled={active}>
    <path d="M12 20.5 C12 20.5 3.5 15.5 3.5 9.5 C3.5 6.5 5.8 4.5 8.3 4.5 C9.9 4.5 11.3 5.3 12 6.6 C12.7 5.3 14.1 4.5 15.7 4.5 C18.2 4.5 20.5 6.5 20.5 9.5 C20.5 15.5 12 20.5 12 20.5 Z" />
  </Svg>
)

export const IconComment = (p) => (
  <Svg {...p}>
    <path d="M20.5 11.5 c0 4.4-3.8 8-8.5 8 c-1.2 0-2.3-.2-3.3-.6 L3.5 20 l1.2-4.3 c-.8-1.2-1.2-2.7-1.2-4.2 c0-4.4 3.8-8 8.5-8 s8.5 3.6 8.5 8 Z" />
  </Svg>
)

export const IconShare = (p) => (
  <Svg {...p}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="M8.2 10.8 L15.8 6.7 M8.2 13.2 L15.8 17.3" />
  </Svg>
)

export const IconBell = (p) => (
  <Svg {...p}>
    <path d="M18 9 c0-3.3-2.7-6-6-6 S6 5.7 6 9 c0 6-2.5 7.5-2.5 7.5 h17 S18 15 18 9 Z" />
    <path d="M10.3 20 a1.9 1.9 0 0 0 3.4 0" />
  </Svg>
)

export const IconBack = (p) => (
  <Svg {...p}>
    <path d="M14.5 5.5 L8 12 L14.5 18.5" />
  </Svg>
)

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6 L18 18 M18 6 L6 18" />
  </Svg>
)

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M9 21 H5 a2 2 0 0 1-2-2 V5 a2 2 0 0 1 2-2 h4" />
    <path d="M16 17 L21 12 L16 7 M21 12 H9" />
  </Svg>
)

// ── КОНТЕНТ ──

// Кейс: гексагон с галочкой (решённая задача)
export const IconCase = (p) => (
  <Svg {...p}>
    <path d="M12 2.5 L20.5 7.25 V16.75 L12 21.5 L3.5 16.75 V7.25 Z" />
    <path d="M8.5 12 L11 14.5 L15.5 9.5" />
  </Svg>
)

// Вопрос
export const IconQuestion = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.3 c0-1.4 1.1-2.5 2.5-2.5 s2.5 1 2.5 2.4 c0 1.8-2.5 2-2.5 3.8" />
    <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconStar = ({ active, ...p }) => (
  <Svg {...p} filled={active}>
    <path d="M12 3 L14.6 8.6 L20.8 9.4 L16.3 13.7 L17.4 19.8 L12 16.8 L6.6 19.8 L7.7 13.7 L3.2 9.4 L9.4 8.6 Z" />
  </Svg>
)

export const IconLocation = (p) => (
  <Svg {...p}>
    <path d="M12 21.5 c0 0 7-5.5 7-11 a7 7 0 1 0-14 0 c0 5.5 7 11 7 11 Z" />
    <circle cx="12" cy="10.5" r="2.5" />
  </Svg>
)

export const IconBriefcase = (p) => (
  <Svg {...p}>
    <rect x="3" y="7.5" width="18" height="12.5" rx="2.5" />
    <path d="M8.5 7.5 V5.5 a2 2 0 0 1 2-2 h3 a2 2 0 0 1 2 2 v2" />
    <path d="M3 12.5 h18" />
  </Svg>
)

export const IconWrench = (p) => (
  <Svg {...p}>
    <path d="M14.5 6.5 a4.5 4.5 0 0 0-6 5.7 L3.5 17.2 a2 2 0 0 0 2.8 2.8 L11.3 15 a4.5 4.5 0 0 0 5.7-6 L14 12 L11.5 9.5 Z" />
  </Svg>
)

export const IconSend = (p) => (
  <Svg {...p}>
    <path d="M21 3 L10 14 M21 3 L14 21 L10 14 L3 10 Z" />
  </Svg>
)

export const IconTag = (p) => (
  <Svg {...p}>
    <path d="M3 11 V4 a1 1 0 0 1 1-1 h7 l10 10 a1.4 1.4 0 0 1 0 2 l-6 6 a1.4 1.4 0 0 1-2 0 Z" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="M4.5 12.5 L9.5 17.5 L19.5 6.5" />
  </Svg>
)

export const IconTelegram = (p) => (
  <Svg {...p}>
    <path d="M21 4 L3.5 11 c-.8.3-.8 1.2 0 1.5 l4.3 1.4 1.6 4.9 c.2.7 1.1.9 1.6.3 l2.4-2.6 4.6 3.4 c.6.4 1.4.1 1.6-.6 L21.8 5 c.2-.8-.5-1.4-1.2-1 Z" />
    <path d="M8 14 L19 6" />
  </Svg>
)
