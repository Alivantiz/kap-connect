import { createContext, useContext } from 'react'

/** Контекст вынесен в отдельный модуль: файл с провайдером тогда
 *  экспортирует только компонент, и быстрое обновление работает корректно. */
export const ToastCtx = createContext(() => {})

export const useToast = () => useContext(ToastCtx)
