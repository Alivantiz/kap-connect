import { useState } from 'react'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Sheet from '../components/ui/Sheet'
import { renderApp } from './helpers'

describe('Модальная шторка', () => {
  it('объявлена как диалог и подписана заголовком', () => {
    renderApp(
      <Sheet title="Новая публикация" onClose={() => {}}>
        <button type="button">Внутри</button>
      </Sheet>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Новая публикация' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('закрывается по Escape — раньше клавиатурой закрыть было нельзя', async () => {
    const onClose = vi.fn()
    const { user } = renderApp(
      <Sheet title="Окно" onClose={onClose}>
        <button type="button">Внутри</button>
      </Sheet>,
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('закрывается по клику мимо окна, но не по клику внутри', async () => {
    const onClose = vi.fn()
    const { user } = renderApp(
      <Sheet title="Окно" onClose={onClose}>
        <button type="button">Внутри</button>
      </Sheet>,
    )
    await user.click(screen.getByRole('button', { name: 'Внутри' }))
    expect(onClose).not.toHaveBeenCalled()

    await user.click(document.querySelector('.sheet-overlay'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ставит фокус на диалог и держит его по кругу по Tab', async () => {
    const { user } = renderApp(
      <Sheet title="Окно" onClose={() => {}}>
        <button type="button">Первая</button>
        <button type="button">Вторая</button>
      </Sheet>,
    )
    // Фокус на самом окне — скринридер зачитывает заголовок диалога.
    expect(screen.getByRole('dialog', { name: 'Окно' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Закрыть' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Первая' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Вторая' })).toHaveFocus()
    // Дальше фокус возвращается в начало, а не уходит под окно
    await user.tab()
    expect(screen.getByRole('button', { name: 'Закрыть' })).toHaveFocus()
  })

  it('возвращает фокус на элемент, который окно открыл', async () => {
    function Host() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Открыть
          </button>
          {open && (
            <Sheet title="Окно" onClose={() => setOpen(false)}>
              <button type="button">Внутри</button>
            </Sheet>
          )}
        </>
      )
    }
    const { user } = renderApp(<Host />)
    const trigger = screen.getByRole('button', { name: 'Открыть' })
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
  })

  it('блокирует прокрутку фона, пока окно открыто', () => {
    const { unmount } = renderApp(
      <Sheet title="Окно" onClose={() => {}}>
        <button type="button">Внутри</button>
      </Sheet>,
    )
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
