import { useCallback, useMemo, useRef, useState } from 'react'
import { IconAlert, IconCheckCircle } from '../Icons'
import { ToastCtx } from './toast-context'

/**
 * Уведомления об ошибках.
 * Раньше сбой лайка, отправки сообщения или отметки решения не показывался
 * никак: интерфейс делал вид, что всё прошло. Теперь любая ошибка из слоя
 * данных видна пользователю.
 */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setItems((list) => list.filter((t) => t.id !== id))
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, kind = 'error') => {
      if (!message) return
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setItems((list) => [...list.slice(-2), { id, message, kind }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), kind === 'error' ? 5200 : 3200),
      )
    },
    [dismiss],
  )

  const api = useMemo(
    () =>
      Object.assign(push, { error: (m) => push(m, 'error'), success: (m) => push(m, 'success') }),
    [push],
  )

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.kind === 'success' ? <IconCheckCircle size={17} /> : <IconAlert size={17} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
