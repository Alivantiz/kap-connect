import { useEffect, useRef, useCallback } from 'react'
import { IconClose } from '../Icons'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Модальное окно, на мобильном — шторка снизу.
 *
 * Раньше модалки закрывались только кликом по фону: Escape не работал,
 * фокус уходил на элементы под окном, а фон продолжал прокручиваться.
 * Здесь есть ловушка фокуса, Escape, блокировка прокрутки и возврат
 * фокуса на элемент, который окно открыл.
 */
export default function Sheet({ title, onClose, children, footer, size = 'default' }) {
  const ref = useRef(null)
  const restoreTo = useRef(null)
  const titleId = useRef(`sheet-${Math.random().toString(36).slice(2, 9)}`).current

  useEffect(() => {
    restoreTo.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    // Фокус ставится на сам диалог, а не на первую кнопку: так скринридер
    // сначала зачитывает заголовок окна, а Tab уводит внутрь содержимого.
    ref.current?.focus()

    return () => {
      document.body.style.overflow = overflow
      if (restoreTo.current instanceof HTMLElement) restoreTo.current.focus()
    }
  }, [])

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      // Видимость намеренно не проверяется через offsetParent: он равен null
      // и в jsdom, и у любого элемента внутри position: fixed, из-за чего
      // ловушка фокуса молча переставала работать.
      const nodes = [...(ref.current?.querySelectorAll(FOCUSABLE) || [])].filter(
        (n) => !n.hasAttribute('hidden'),
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  return (
    <div className="sheet-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        className={`sheet sheet-${size}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <header className="sheet-head">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <IconClose size={18} />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}
