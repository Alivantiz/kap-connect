import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Communities from '../screens/Communities'
import { ok, fail, renderApp } from './helpers'

vi.mock('../lib/db')
import * as db from '../lib/db'

const group = (over = {}) => ({
  id: 'c-1',
  name: 'КИПиА Казатомпром',
  description: 'Слесари и инженеры КИПиА всей группы.',
  icon: 'gauge',
  kind: 'specialty',
  is_closed: false,
  creator_id: null,
  members_count: 12,
  ...over,
})

beforeEach(() => {
  db.listCommunities.mockResolvedValue({ data: [group()], error: null })
  db.myCommunityIds.mockResolvedValue({ data: new Set(), error: null })
  db.joinCommunity.mockReturnValue(ok(null))
  db.leaveCommunity.mockReturnValue(ok(null))
  db.deleteCommunity.mockReturnValue(ok(null))
  db.createCommunity.mockReturnValue(ok({ id: 'c-new' }))
})

describe('Сообщества', () => {
  it('показывает группу со счётчиком участников', async () => {
    renderApp(<Communities myId="me-1" />)
    expect(await screen.findByText('КИПиА Казатомпром')).toBeInTheDocument()
    expect(screen.getByText('12 участников')).toBeInTheDocument()
  })

  it('вступление меняет кнопку и увеличивает счётчик', async () => {
    const { user } = renderApp(<Communities myId="me-1" />)
    await screen.findByText('КИПиА Казатомпром')

    await user.click(screen.getByRole('button', { name: 'Вступить' }))

    expect(db.joinCommunity).toHaveBeenCalledWith('c-1', 'me-1')
    expect(await screen.findByRole('button', { name: 'Вы в группе' })).toBeInTheDocument()
    expect(screen.getByText('13 участников')).toBeInTheDocument()
  })

  it('откатывает вступление, если запрос не прошёл', async () => {
    db.joinCommunity.mockReturnValue(fail('Недостаточно прав для этого действия'))
    const { user } = renderApp(<Communities myId="me-1" />)
    await screen.findByText('КИПиА Казатомпром')

    await user.click(screen.getByRole('button', { name: 'Вступить' }))

    expect(await screen.findByText('Недостаточно прав для этого действия')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Вступить' })).toBeInTheDocument(),
    )
    expect(screen.getByText('12 участников')).toBeInTheDocument()
  })

  it('кнопки правки видны только создателю группы', async () => {
    db.listCommunities.mockResolvedValue({ data: [group({ creator_id: 'me-1' })], error: null })
    renderApp(<Communities myId="me-1" />)
    await screen.findByText('КИПиА Казатомпром')

    expect(screen.getByRole('button', { name: /Изменить КИПиА/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Удалить КИПиА/ })).toBeInTheDocument()
  })

  it('создаёт группу с выбранным знаком вместо эмодзи', async () => {
    const { user } = renderApp(<Communities myId="me-1" />)
    await screen.findByText('КИПиА Казатомпром')

    await user.click(screen.getByRole('button', { name: 'Создать сообщество' }))
    await user.type(screen.getByLabelText(/Название/), 'Насосное оборудование')
    await user.click(screen.getByRole('radio', { name: 'Бурение' }))
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() =>
      expect(db.createCommunity).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Насосное оборудование',
          icon: 'drill',
          kind: 'specialty',
          creator_id: 'me-1',
        }),
      ),
    )
    // Создатель сразу становится участником
    expect(db.joinCommunity).toHaveBeenCalledWith('c-new', 'me-1')
  })

  it('фильтр по типу перезапрашивает список', async () => {
    const { user } = renderApp(<Communities myId="me-1" />)
    await screen.findByText('КИПиА Казатомпром')

    await user.click(screen.getByRole('tab', { name: 'Предприятия' }))
    await waitFor(() => expect(db.listCommunities).toHaveBeenCalledWith('dzo'))
  })
})
