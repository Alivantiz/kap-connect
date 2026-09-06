import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { ok, profileFixture } from './helpers'

// App сам оборачивает дерево в ToastProvider, поэтому обёртка из helpers
// здесь не нужна — она бы вложила провайдер второй раз.
const renderApp = (ui) => ({ user: userEvent.setup(), ...render(ui) })

vi.mock('../lib/db')
import * as db from '../lib/db'

const session = { user: { id: 'me-1' } }

beforeEach(() => {
  db.auth.getSession.mockResolvedValue({ data: { session }, error: null })
  db.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  db.getProfile.mockReturnValue(ok(profileFixture()))
  db.unreadMessageCount.mockReturnValue(ok(3))
  db.countUnreadNotifications.mockReturnValue(ok(12))
  db.subscribeToMyNotifications.mockReturnValue(() => {})
  db.listFeed.mockResolvedValue({ data: [], error: null })
  db.myLikedPostIds.mockResolvedValue({ data: new Set(), error: null })
  db.listCommunities.mockResolvedValue({ data: [], error: null })
  db.myCommunityIds.mockResolvedValue({ data: new Set(), error: null })
  db.listConversations.mockResolvedValue({ data: [], error: null })
  db.listNotifications.mockResolvedValue({ data: [], error: null })
  db.markNotificationsRead.mockReturnValue(ok(null))
  db.listDzo.mockReturnValue(ok([]))
  db.searchProfiles.mockReturnValue(ok([]))
})

describe('Каркас приложения', () => {
  it('показывает экран входа, пока нет сессии', async () => {
    db.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    renderApp(<App />)
    expect(await screen.findByRole('button', { name: 'Войти' })).toBeInTheDocument()
  })

  it('показывает пять вкладок и счётчики непрочитанного', async () => {
    renderApp(<App />)
    await screen.findByRole('navigation', { name: 'Основная навигация' })

    for (const label of ['Лента', 'Группы', 'Чаты', 'События', 'Профиль']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument()
    }
    expect(await screen.findByLabelText('Непрочитанных: 3')).toBeInTheDocument()
    // Больше девяти сокращается, но точное число остаётся в подписи
    expect(screen.getByLabelText('Непрочитанных: 12')).toHaveTextContent('9+')
  })

  it('переключает вкладки', async () => {
    const { user } = renderApp(<App />)
    await screen.findByRole('navigation', { name: 'Основная навигация' })

    await user.click(screen.getByRole('button', { name: /Группы/ }))
    expect(await screen.findByRole('heading', { name: 'Сообщества' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /События/ }))
    expect(await screen.findByRole('heading', { name: 'Активность' })).toBeInTheDocument()
  })

  it('кнопка создания есть только в ленте', async () => {
    const { user } = renderApp(<App />)
    await screen.findByRole('navigation', { name: 'Основная навигация' })
    expect(screen.getByRole('button', { name: 'Создать публикацию' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Группы/ }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Создать публикацию' })).not.toBeInTheDocument(),
    )
  })

  it('открывает и закрывает поиск', async () => {
    const { user } = renderApp(<App />)
    await screen.findByRole('navigation', { name: 'Основная навигация' })

    await user.click(screen.getByRole('button', { name: 'Поиск экспертов' }))
    expect(await screen.findByLabelText('Поиск сотрудников')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Закрыть поиск' }))
    await waitFor(() =>
      expect(screen.queryByLabelText('Поиск сотрудников')).not.toBeInTheDocument(),
    )
  })

  it('аппаратная кнопка «назад» закрывает поиск, а не приложение', async () => {
    const { user } = renderApp(<App />)
    await screen.findByRole('navigation', { name: 'Основная навигация' })

    await user.click(screen.getByRole('button', { name: 'Поиск экспертов' }))
    await screen.findByLabelText('Поиск сотрудников')

    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await waitFor(() =>
      expect(screen.queryByLabelText('Поиск сотрудников')).not.toBeInTheDocument(),
    )
  })

  it('закрытие слоя из интерфейса не оставляет лишнюю запись в истории', async () => {
    // Иначе следующее нажатие «назад» уходит впустую и кнопка кажется залипшей.
    const push = vi.spyOn(window.history, 'pushState')
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { user } = renderApp(<App />)
    await screen.findByRole('navigation', { name: 'Основная навигация' })

    await user.click(screen.getByRole('button', { name: 'Поиск экспертов' }))
    await screen.findByLabelText('Поиск сотрудников')
    expect(push).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Закрыть поиск' }))
    await waitFor(() => expect(back).toHaveBeenCalled())
  })
})
