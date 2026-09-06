import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Activity from '../screens/Activity'
import { ok, renderApp } from './helpers'

vi.mock('../lib/db')
import * as db from '../lib/db'

const notif = (over = {}) => ({
  id: 'n-1',
  type: 'like',
  read: false,
  created_at: new Date().toISOString(),
  actor: { id: 'other-1', full_name: 'Бекова Айгуль', position: 'Технолог', dzo: 'АО «СП «Инкай»' },
  post: { id: 'p-1', title: 'Замена уплотнения насоса', type: 'case' },
  ...over,
})

beforeEach(() => {
  db.listNotifications.mockResolvedValue({ data: [notif()], error: null })
  db.markNotificationsRead.mockReturnValue(ok(null))
})

describe('Активность', () => {
  it('показывает уведомление с именем, действием и публикацией', async () => {
    renderApp(<Activity myId="me-1" onOpenProfile={() => {}} />)
    expect(await screen.findByText('Бекова Айгуль')).toBeInTheDocument()
    expect(screen.getByText(/оценил вашу публикацию/)).toBeInTheDocument()
    expect(screen.getByText(/Замена уплотнения насоса/)).toBeInTheDocument()
  })

  it('помечает всё прочитанным при открытии', async () => {
    const onRead = vi.fn()
    renderApp(<Activity myId="me-1" onOpenProfile={() => {}} onRead={onRead} />)
    await waitFor(() => expect(db.markNotificationsRead).toHaveBeenCalledWith('me-1'))
    await waitFor(() => expect(onRead).toHaveBeenCalled())
  })

  it('не перезапрашивает список, когда родитель отдаёт новую функцию onRead', async () => {
    // Раньше onRead попадал в зависимости useCallback загрузки, и каждый тик
    // таймера в App заново тянул 50 строк и слал UPDATE.
    const { rerender } = renderApp(
      <Activity myId="me-1" onOpenProfile={() => {}} onRead={() => {}} />,
    )
    await screen.findByText('Бекова Айгуль')
    expect(db.listNotifications).toHaveBeenCalledTimes(1)

    const readCalls = db.markNotificationsRead.mock.calls.length

    rerender(<Activity myId="me-1" onOpenProfile={() => {}} onRead={() => {}} />)
    await waitFor(() => expect(db.listNotifications).toHaveBeenCalledTimes(1))
    // Отметка прочитанного — тоже запись в базу, и она не должна повторяться.
    expect(db.markNotificationsRead).toHaveBeenCalledTimes(readCalls)
  })

  it('показывает подсказку во вкладке без событий, а не пустой экран', async () => {
    // Прежняя проверка смотрела на весь список, а рендерился отфильтрованный.
    const { user } = renderApp(<Activity myId="me-1" onOpenProfile={() => {}} />)
    await screen.findByText('Бекова Айгуль')

    await user.click(screen.getByRole('tab', { name: 'Решения' }))
    expect(await screen.findByText('В этой категории пока пусто.')).toBeInTheDocument()
  })

  it('открывает профиль автора события', async () => {
    const onOpenProfile = vi.fn()
    const { user } = renderApp(<Activity myId="me-1" onOpenProfile={onOpenProfile} />)
    await user.click(await screen.findByText('Бекова Айгуль'))
    expect(onOpenProfile).toHaveBeenCalledWith('other-1')
  })

  it('не открывает чужой профиль, если автор удалён', async () => {
    // undefined доходил до App и открывал СВОЙ профиль без кнопки «назад».
    db.listNotifications.mockResolvedValue({ data: [notif({ actor: null })], error: null })
    const onOpenProfile = vi.fn()
    const { user } = renderApp(<Activity myId="me-1" onOpenProfile={onOpenProfile} />)

    await user.click(await screen.findByText('Пользователь'))
    expect(onOpenProfile).not.toHaveBeenCalled()
  })

  it('показывает пустое состояние', async () => {
    db.listNotifications.mockResolvedValue({ data: [], error: null })
    renderApp(<Activity myId="me-1" onOpenProfile={() => {}} />)
    expect(await screen.findByText('Нет уведомлений')).toBeInTheDocument()
  })
})
