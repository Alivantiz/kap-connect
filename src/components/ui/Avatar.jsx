import { avaColor, initials } from '../../lib/format'
import { IconStar } from '../Icons'

/**
 * Аватар с инициалами. Кликабельный вариант — это button, а не div,
 * иначе он недоступен с клавиатуры и не читается скринридером.
 */
export default function Avatar({ name, size = 40, onClick, expert = false, className = '' }) {
  const style = {
    background: avaColor(name),
    width: size,
    height: size,
    fontSize: Math.round(size * 0.36),
  }
  const label = name || 'Профиль'
  const content = <span aria-hidden="true">{initials(name)}</span>

  const inner = onClick ? (
    <button
      type="button"
      className={`ava ava-btn ${className}`}
      style={style}
      onClick={onClick}
      aria-label={`Открыть профиль: ${label}`}
    >
      {content}
    </button>
  ) : (
    <div className={`ava ${className}`} style={style} role="img" aria-label={label}>
      {content}
    </div>
  )

  if (!expert) return inner
  return (
    <span className="ava-wrap" style={{ width: size, height: size }}>
      {inner}
      <span className="ava-expert" title="Эксперт">
        <IconStar size={Math.max(9, Math.round(size * 0.26))} active />
      </span>
    </span>
  )
}
