import { createContext, useContext } from 'react'

/** Контекст отдельно от провайдера, чтобы файл с компонентом экспортировал только компонент. */
export const ConfirmCtx = createContext(() => Promise.resolve(false))

/**
 * Возвращает функцию confirm({ title, text, action, danger }) → Promise<boolean>.
 * Заменяет window.confirm: системное окно выглядит чужеродно на телефоне,
 * не поддаётся оформлению, а во встроенном фрейме молча возвращает false.
 */
export const useConfirm = () => useContext(ConfirmCtx)
