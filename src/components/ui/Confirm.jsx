import { useCallback, useRef, useState } from 'react'
import Sheet from './Sheet'
import Button from './Button'
import { ConfirmCtx } from './confirm-context'

export function ConfirmProvider({ children }) {
  const [ask, setAsk] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setAsk({ action: 'Продолжить', ...options })
      }),
    [],
  )

  const settle = (value) => {
    setAsk(null)
    resolver.current?.(value)
    resolver.current = null
  }

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {ask && (
        <Sheet
          title={ask.title}
          onClose={() => settle(false)}
          footer={
            <div className="confirm-actions">
              <Button variant="ghost" size="lg" onClick={() => settle(false)}>
                Отмена
              </Button>
              <Button
                variant={ask.danger ? 'danger' : 'primary'}
                size="lg"
                onClick={() => settle(true)}
              >
                {ask.action}
              </Button>
            </div>
          }
        >
          {ask.text && <p className="confirm-text">{ask.text}</p>}
        </Sheet>
      )}
    </ConfirmCtx.Provider>
  )
}
