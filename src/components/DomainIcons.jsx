// Отраслевые иконки KAP Connect — знаки специальностей и площадок.
//
// Реестр DOMAIN_ICONS лежит рядом с самими иконками намеренно: вынести его
// в отдельный модуль нельзя без циклического импорта, потому что компонент
// DomainIcon сам этот реестр и читает.
/* eslint-disable react-refresh/only-export-components */

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

/* ── Набор ──
   Используются для сообществ и специальностей вместо эмодзи.       */

/** КИПиА: манометр — циферблат со стрелкой и делениями. */
const IconGauge = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="m12 12 3.6-3.2" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <path d="M12 3.8v1.6M20.2 12h-1.6M12 20.2v-1.6M3.8 12h1.6" opacity=".6" />
  </Svg>
)

/** Буровики: вышка — А-образная рама с раскосами и штангой в грунт. */
const IconDrill = (p) => (
  <Svg {...p}>
    <path d="M7 20.2 12 3.8l5 16.4" />
    <path d="M9.2 12.6h5.6M8.2 16.4h7.6" opacity=".65" />
    <path d="M12 8.6v11.6" opacity=".8" />
    <path d="M4.4 20.2h15.2" />
  </Svg>
)

/** Химики: коническая колба с уровнем раствора. */
const IconFlask = (p) => (
  <Svg {...p}>
    <path d="M9.4 3.8v5.6L4.9 17.6a2 2 0 0 0 1.7 3h10.8a2 2 0 0 0 1.7-3l-4.5-8.2V3.8" />
    <path d="M8.6 3.8h6.8" />
    <path d="M7.2 14.4h9.6" opacity=".65" />
  </Svg>
)

/** Механики: рожковый ключ по диагонали. */
const IconWrenchTool = (p) => (
  <Svg {...p}>
    <path d="M16.8 3.9a4.6 4.6 0 0 0-5.6 5.9L4 17l3 3 7.2-7.2a4.6 4.6 0 0 0 5.9-5.6l-2.7 2.7-2.7-.6-.6-2.7z" />
  </Svg>
)

/** Энергетики: молния. */
const IconBolt = (p) => (
  <Svg {...p}>
    <path d="M13.6 2.8 5.4 13.4h5.4l-1.4 7.8 8.2-10.6h-5.4z" />
  </Svg>
)

/** Геологи: пласты породы со смещением. */
const IconLayers = (p) => (
  <Svg {...p}>
    <path d="M3.6 7.6 12 4l8.4 3.6L12 11.2z" />
    <path d="m3.6 12 8.4 3.6L20.4 12" opacity=".7" />
    <path d="m3.6 16.4 8.4 3.6 8.4-3.6" opacity=".45" />
  </Svg>
)

/** Охрана труда: щит с галочкой. */
const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3.4 5 6.2v5.4c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6.2z" />
    <path d="m9.2 12.2 2.1 2.1 4-4.3" opacity=".8" />
  </Svg>
)

/** Молодые специалисты: каска с гребнем и козырьком. */
const IconHelmet = (p) => (
  <Svg {...p}>
    <path d="M4.6 16.4a7.4 7.4 0 0 1 14.8 0" />
    <path d="M3 16.4h18" />
    <path d="M9.6 9.4V6.6a1 1 0 0 1 1-1h2.8a1 1 0 0 1 1 1v2.8" opacity=".7" />
    <path d="M12 5.6v-.8" opacity=".5" />
  </Svg>
)

/** Горы — площадки в предгорьях. */
const IconMountain = (p) => (
  <Svg {...p}>
    <path d="M2.8 19.4 9 8.2l4 6.6 2.4-3.6 5.8 8.2z" />
    <path d="m7.2 11.4 3.6.6" opacity=".5" />
  </Svg>
)

/** Завод: пилообразная кровля и труба. */
const IconFactory = (p) => (
  <Svg {...p}>
    <path d="M3.4 20.2V11l4.6 3V11l4.6 3V11l4.6 3V6.4h3v13.8z" />
    <path d="M3.4 20.2h17.2" />
    <path d="M7.6 17.2h1.2M12.2 17.2h1.2M16.8 17.2h1.2" opacity=".55" />
  </Svg>
)

/** Кран: мачта, стрела и крюк. */
const IconCrane = (p) => (
  <Svg {...p}>
    <path d="M7.6 20.4V4.4h12" />
    <path d="M7.6 4.4 4 9.6h7.2z" opacity=".7" />
    <path d="M14.8 4.4v3.8" />
    <path d="M13.4 8.2h2.8l-1.4 2.4z" />
    <path d="M5 20.4h5.2" />
  </Svg>
)

/** Молоток. */
const IconHammer = (p) => (
  <Svg {...p}>
    <path d="M14.6 6.4 8.8 3.6 4.6 7.8l2.8 5.8 2.4-2.4 7.6 7.6a1.8 1.8 0 0 0 2.6-2.6l-7.6-7.6z" />
    <path d="m8.8 3.6 3 3" opacity=".5" />
  </Svg>
)

/** Шестерня. */
const IconGear = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5" />
  </Svg>
)

/** Атом — общая тематика отрасли. */
const IconAtom = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none" />
    <ellipse cx="12" cy="12" rx="9" ry="4.1" />
    <ellipse cx="12" cy="12" rx="9" ry="4.1" transform="rotate(60 12 12)" opacity=".7" />
    <ellipse cx="12" cy="12" rx="9" ry="4.1" transform="rotate(-60 12 12)" opacity=".7" />
  </Svg>
)

/** Трубопровод с фланцем и вентилем. */
const IconPipe = (p) => (
  <Svg {...p}>
    <path d="M2.8 14.4h5.4V9.6h7.6v4.8h5.4" />
    <path d="M8.2 8.2v7.6M15.8 8.2v7.6" opacity=".6" />
    <path d="M12 9.6V6.4M10.2 5.4h3.6" />
  </Svg>
)

/** Связь: мачта с волнами. */
const IconAntenna = (p) => (
  <Svg {...p}>
    <path d="M12 9.4v10.8M8.6 20.2h6.8" />
    <path d="M8.4 8.4a5 5 0 0 1 7.2 0" opacity=".8" />
    <path d="M5.8 5.6a8.6 8.6 0 0 1 12.4 0" opacity=".5" />
    <circle cx="12" cy="10.6" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
)

/** Освещение. */
const IconLamp = (p) => (
  <Svg {...p}>
    <path d="M12 3.4a6 6 0 0 0-3.4 11v2.2h6.8v-2.2A6 6 0 0 0 12 3.4Z" />
    <path d="M10 20.2h4" />
  </Svg>
)

/** Аналитика и показатели. */
const IconChart = (p) => (
  <Svg {...p}>
    <path d="M4 20.2V4.4M4 20.2h16" />
    <path d="M8 17V12M12.6 17V7.8M17.2 17v-6.6" />
  </Svg>
)

/** Экология и рекультивация. */
const IconLeaf = (p) => (
  <Svg {...p}>
    <path d="M20 4c0 9-5.2 13.4-10.6 13.4a5.4 5.4 0 0 1-5.4-5.4C4 6.6 10.4 4 20 4Z" />
    <path d="M5.4 20.4c2-5.6 5.4-9 9.6-11.2" opacity=".6" />
  </Svg>
)

/** Транспорт и логистика. */
const IconTruck = (p) => (
  <Svg {...p}>
    <path d="M2.8 6.6h10.4v10H2.8z" />
    <path d="M13.2 10h3.8l3.2 3.2v3.4h-7z" />
    <circle cx="7" cy="18.4" r="1.8" />
    <circle cx="16.6" cy="18.4" r="1.8" />
  </Svg>
)

/** Сварка и металлообработка. */
const IconSpark = (p) => (
  <Svg {...p}>
    <path d="M12 3v4.4M12 16.6V21M3 12h4.4M16.6 12H21" />
    <path d="m5.6 5.6 3.1 3.1M15.3 15.3l3.1 3.1M18.4 5.6l-3.1 3.1M8.7 15.3l-3.1 3.1" opacity=".6" />
    <circle cx="12" cy="12" r="2.4" />
  </Svg>
)

/** Радиационный контроль. */
const IconRadiation = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    <path d="M12 9.6 9.6 5.2a8 8 0 0 1 4.8 0z" />
    <path d="m10.2 13.2-4.6 2a8 8 0 0 1-1.2-4.6z" opacity=".8" />
    <path d="m13.8 13.2 4.6 2a8 8 0 0 0 1.2-4.6z" opacity=".8" />
  </Svg>
)

/* ─────────────── Реестр отраслевых иконок ───────────────
   Сообщества хранят в базе имя иконки (колонка icon), а не эмодзи. */

export const DOMAIN_ICONS = {
  gauge: { Icon: IconGauge, label: 'КИПиА' },
  drill: { Icon: IconDrill, label: 'Бурение' },
  flask: { Icon: IconFlask, label: 'Химия' },
  wrench: { Icon: IconWrenchTool, label: 'Механика' },
  bolt: { Icon: IconBolt, label: 'Энергетика' },
  layers: { Icon: IconLayers, label: 'Геология' },
  shield: { Icon: IconShield, label: 'Охрана труда' },
  helmet: { Icon: IconHelmet, label: 'Специалисты' },
  mountain: { Icon: IconMountain, label: 'Рудник' },
  factory: { Icon: IconFactory, label: 'Завод' },
  crane: { Icon: IconCrane, label: 'Стройка' },
  hammer: { Icon: IconHammer, label: 'Ремонт' },
  gear: { Icon: IconGear, label: 'Оборудование' },
  atom: { Icon: IconAtom, label: 'Атом' },
  pipe: { Icon: IconPipe, label: 'Трубопровод' },
  antenna: { Icon: IconAntenna, label: 'Связь' },
  lamp: { Icon: IconLamp, label: 'Освещение' },
  chart: { Icon: IconChart, label: 'Аналитика' },
  leaf: { Icon: IconLeaf, label: 'Экология' },
  truck: { Icon: IconTruck, label: 'Транспорт' },
  spark: { Icon: IconSpark, label: 'Сварка' },
  radiation: { Icon: IconRadiation, label: 'Радиация' },
}

export const DOMAIN_ICON_KEYS = [
  'gauge',
  'drill',
  'flask',
  'wrench',
  'bolt',
  'layers',
  'shield',
  'helmet',
  'mountain',
  'factory',
  'crane',
  'hammer',
  'gear',
  'atom',
  'pipe',
  'antenna',
  'lamp',
  'chart',
  'leaf',
  'truck',
  'spark',
  'radiation',
]

/** Иконка сообщества по имени из базы. Неизвестное имя не ломает вёрстку. */
export const DomainIcon = ({ name, size = 22, ...rest }) => {
  const entry = DOMAIN_ICONS[name] || DOMAIN_ICONS.gear
  const { Icon } = entry
  return <Icon size={size} {...rest} />
}
