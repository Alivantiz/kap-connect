// Собственный набор иконок KAP Connect.
//
// Единая сетка 24×24, штрих 1.7, скруглённые концы, цвет наследуется из
// currentColor. Эмодзи в интерфейсе не используются: они выглядят по-разному
// в Android, iOS и Windows, не наследуют цвет темы и не масштабируются
// вместе с текстом.

const Svg = ({ size = 22, sw = 1.7, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
)

/* ─────────────────────────── Логотип ───────────────────────────
   Гексагон — отсылка к решётке и к атомной тематике; внутри орбита
   с ядром. Знак читается на 20px и не разваливается на 40px.         */
export const Logo = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2.2 20.2 7v10L12 21.8 3.8 17V7z"
      stroke={color}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="6.4"
      ry="2.9"
      stroke={color}
      strokeWidth="1.3"
      opacity=".55"
      transform="rotate(-28 12 12)"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="6.4"
      ry="2.9"
      stroke={color}
      strokeWidth="1.3"
      opacity=".55"
      transform="rotate(28 12 12)"
    />
    <circle cx="12" cy="12" r="2.1" fill={color} />
  </svg>
)

/* ─────────────────────── Навигация и действия ─────────────────── */

export const IconFeed = (p) => (
  <Svg {...p}>
    <rect x="3.2" y="4.2" width="17.6" height="6.2" rx="2" />
    <rect x="3.2" y="13.6" width="17.6" height="6.2" rx="2" />
    <path d="M6.6 7.3h4.2M6.6 16.7h4.2" opacity=".55" />
  </Svg>
)

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="10.8" cy="10.8" r="6.6" />
    <path d="m15.6 15.6 4.2 4.2" />
  </Svg>
)

export const IconGroups = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8.6" r="3.2" />
    <path d="M3.4 19.2c0-3 2.5-5 5.6-5s5.6 2 5.6 5" />
    <path d="M16.2 6.2a3.1 3.1 0 0 1 0 5.9" opacity=".65" />
    <path d="M17.6 14.6c1.9.5 3.2 2.1 3.2 4.3" opacity=".65" />
  </Svg>
)

export const IconProfile = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8.4" r="3.7" />
    <path d="M4.8 19.8c0-3.6 3.2-6 7.2-6s7.2 2.4 7.2 6" />
  </Svg>
)

export const IconBell = (p) => (
  <Svg {...p}>
    <path d="M6.4 10.2a5.6 5.6 0 0 1 11.2 0c0 4 1.4 5.4 1.4 5.4H5s1.4-1.4 1.4-5.4Z" />
    <path d="M10.2 18.6a2 2 0 0 0 3.6 0" />
  </Svg>
)

export const IconComment = (p) => (
  <Svg {...p}>
    <path d="M20 12.4c0 3.9-3.6 7-8 7a9 9 0 0 1-2.6-.4L4.6 20.4l1.2-3.6A6.7 6.7 0 0 1 4 12.4c0-3.9 3.6-7 8-7s8 3.1 8 7Z" />
  </Svg>
)

export const IconMessages = (p) => (
  <Svg {...p}>
    <path d="M20.2 11.6c0 3.6-3.4 6.5-7.6 6.5-.9 0-1.8-.1-2.6-.4l-4.6 1.9 1.3-3.6a6.3 6.3 0 0 1-1.7-4.4C5 8 8.4 5.1 12.6 5.1s7.6 2.9 7.6 6.5Z" />
    <path d="M9.6 11.5h6M9.6 8.8h3.6" opacity=".55" />
  </Svg>
)

export const IconPlus = (p) => (
  <Svg {...p} sw={p.sw || 2}>
    <path d="M12 5.4v13.2M5.4 12h13.2" />
  </Svg>
)

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" />
  </Svg>
)

export const IconBack = (p) => (
  <Svg {...p}>
    <path d="M19.2 12H5.2" />
    <path d="m11 5.8-6 6.2 6 6.2" />
  </Svg>
)

export const IconChevronDown = (p) => (
  <Svg {...p}>
    <path d="m6.5 9.5 5.5 5.4 5.5-5.4" />
  </Svg>
)

export const IconChevronRight = (p) => (
  <Svg {...p}>
    <path d="m9.5 6 5.5 6-5.5 6" />
  </Svg>
)

export const IconSend = (p) => (
  <Svg {...p}>
    <path d="M20.4 3.6 10.6 13.4" />
    <path d="M20.4 3.6 14.2 20.4l-3.6-7-7-3.6z" />
  </Svg>
)

export const IconCheck = (p) => (
  <Svg {...p} sw={p.sw || 2}>
    <path d="m5 12.6 4.6 4.4L19 6.6" />
  </Svg>
)

export const IconCheckCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="m8.2 12.2 2.6 2.6 5-5.4" />
  </Svg>
)

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M10 20.2H6a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2h4" />
    <path d="m15.4 8.2 3.8 3.8-3.8 3.8M19.2 12H9.4" />
  </Svg>
)

export const IconEdit = (p) => (
  <Svg {...p}>
    <path d="M4.4 19.6h4l10-10a2.3 2.3 0 0 0-3.2-3.2l-10 10z" />
    <path d="m13.6 7.2 3.2 3.2" opacity=".55" />
  </Svg>
)

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4.8 6.8h14.4M9.4 6.8V5.2a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.6" />
    <path d="M6.6 6.8 7.4 19a1.6 1.6 0 0 0 1.6 1.4h6a1.6 1.6 0 0 0 1.6-1.4l.8-12.2" />
    <path d="M10.6 10.4v6M13.4 10.4v6" opacity=".5" />
  </Svg>
)

export const IconHeart = ({ active, ...p }) => (
  <Svg {...p} fill={active ? 'currentColor' : 'none'}>
    <path d="M12 20.2S3.8 15.4 3.8 9.9a4.3 4.3 0 0 1 8.2-1.8 4.3 4.3 0 0 1 8.2 1.8c0 5.5-8.2 10.3-8.2 10.3Z" />
  </Svg>
)

export const IconStar = ({ active, ...p }) => (
  <Svg {...p} fill={active ? 'currentColor' : 'none'}>
    <path d="m12 3.8 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4.1 5.8-.8z" />
  </Svg>
)

export const IconLocation = (p) => (
  <Svg {...p}>
    <path d="M19 10.4c0 5.2-7 10-7 10s-7-4.8-7-10a7 7 0 0 1 14 0Z" />
    <circle cx="12" cy="10.2" r="2.5" />
  </Svg>
)

export const IconBriefcase = (p) => (
  <Svg {...p}>
    <rect x="3.4" y="7.6" width="17.2" height="12" rx="2.2" />
    <path d="M9 7.6V6a1.8 1.8 0 0 1 1.8-1.8h2.4A1.8 1.8 0 0 1 15 6v1.6" />
    <path d="M3.4 12.6h17.2" opacity=".5" />
  </Svg>
)

export const IconTag = (p) => (
  <Svg {...p}>
    <path d="M11.4 3.8H4.6a.8.8 0 0 0-.8.8v6.8c0 .2.1.4.2.6l8 8a.8.8 0 0 0 1.2 0l7-7a.8.8 0 0 0 0-1.2l-8-8a.8.8 0 0 0-.6-.2Z" />
    <circle cx="8.2" cy="8.2" r="1.5" />
  </Svg>
)

export const IconTelegram = (p) => (
  <Svg {...p}>
    <path d="M20.8 4.6 2.9 11.4c-.7.3-.7 1.2.1 1.4l4.5 1.4 1.7 5.1c.2.6 1 .8 1.4.2l2.4-2.9 4.5 3.3c.5.4 1.3.1 1.4-.6l2.6-13.4c.1-.7-.6-1.3-1.7-.9Z" />
    <path d="m7.5 14.2 9.9-6.8-6.2 7.4-.3 4" opacity=".55" />
  </Svg>
)

export const IconLock = (p) => (
  <Svg {...p}>
    <rect x="4.8" y="10.4" width="14.4" height="9.4" rx="2.2" />
    <path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" />
  </Svg>
)

export const IconFilter = (p) => (
  <Svg {...p}>
    <path d="M4 6.4h16M7 12h10M10 17.6h4" />
  </Svg>
)

export const IconAlert = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 7.8v5M12 16.1v.1" />
  </Svg>
)

export const IconRefresh = (p) => (
  <Svg {...p}>
    <path d="M20 11.4a8 8 0 1 0-.6 4.6" />
    <path d="M20.4 5.4v6h-6" />
  </Svg>
)

/* ───────────────────────── Типы публикаций ────────────────────── */

export const IconPost = (p) => (
  <Svg {...p}>
    <rect x="4" y="4.6" width="16" height="14.8" rx="2.4" />
    <path d="M7.6 9.4h8.8M7.6 12.8h8.8M7.6 16.2h5.2" opacity=".75" />
  </Svg>
)

/** Кейс: разобранный случай — документ с гаечным ключом. */
export const IconCase = (p) => (
  <Svg {...p}>
    <path d="M5 5.8a2 2 0 0 1 2-2h6.2l5 5v9.4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
    <path d="M13 3.8v5.4h5.2" opacity=".6" />
    <path d="M14.6 13.2a2.4 2.4 0 0 1-3.2 3.1l-2.3 2.3-1.2-1.2 2.3-2.3a2.4 2.4 0 0 1 3.1-3.2l-1.5 1.5 1.2 1.2z" />
  </Svg>
)

/** Вопрос: реплика с вопросительным знаком. */
export const IconQuestion = (p) => (
  <Svg {...p}>
    <path d="M20 11.8c0 3.8-3.6 6.9-8 6.9-.9 0-1.8-.1-2.6-.4l-4.8 2 1.3-3.9A6.6 6.6 0 0 1 4 11.8C4 8 7.6 4.9 12 4.9s8 3.1 8 6.9Z" />
    <path d="M10.2 10a1.9 1.9 0 0 1 3.7.6c0 1.3-1.9 1.6-1.9 2.9" />
    <path d="M12 15.5v.1" />
  </Svg>
)

/* ─────────────────── Пустые состояния и подсказки ─────────────── */

export const IconEmptyFeed = (p) => (
  <Svg {...p} sw={p.sw || 1.4}>
    <rect x="3" y="4.4" width="18" height="6" rx="2" opacity=".9" />
    <rect x="3" y="13.6" width="18" height="6" rx="2" opacity=".45" />
    <path d="M6.6 7.4h5.4" opacity=".5" />
  </Svg>
)

export const IconEmptyInbox = (p) => (
  <Svg {...p} sw={p.sw || 1.4}>
    <path d="M3.4 12.6h4.2l1.4 2.4h6l1.4-2.4h4.2" />
    <path d="M4.6 6.6 3.4 12.6v4a2 2 0 0 0 2 2h13.2a2 2 0 0 0 2-2v-4l-1.2-6a2 2 0 0 0-2-1.6H6.6a2 2 0 0 0-2 1.6Z" />
  </Svg>
)

export const IconEmptySearch = (p) => (
  <Svg {...p} sw={p.sw || 1.4}>
    <circle cx="10.6" cy="10.6" r="6.4" />
    <path d="m15.2 15.2 4.4 4.4" />
    <path d="M8 10.6h5.2" opacity=".5" />
  </Svg>
)

export const IconEmptyBell = (p) => (
  <Svg {...p} sw={p.sw || 1.4}>
    <path d="M6.4 10.2a5.6 5.6 0 0 1 11.2 0c0 4 1.4 5.4 1.4 5.4H5s1.4-1.4 1.4-5.4Z" />
    <path d="M10.2 18.6a2 2 0 0 0 3.6 0" />
  </Svg>
)

export const IconHand = (p) => (
  <Svg {...p} sw={p.sw || 1.4}>
    <path d="M8.6 11V5.9a1.4 1.4 0 0 1 2.8 0V11" />
    <path d="M11.4 10.6V4.8a1.4 1.4 0 0 1 2.8 0v5.8" />
    <path d="M14.2 11V6.8a1.4 1.4 0 0 1 2.8 0v6.4c0 3.8-2.2 6.6-5.6 6.6-3 0-4.6-1.6-5.8-4.4l-1.2-2.8a1.4 1.4 0 0 1 2.3-1.5l1.9 2.2" />
  </Svg>
)

export const IconIdea = (p) => (
  <Svg {...p}>
    <path d="M9.4 17.6a5.8 5.8 0 1 1 5.2 0" />
    <path d="M9.6 17.6h4.8M10.4 20.2h3.2" />
  </Svg>
)
