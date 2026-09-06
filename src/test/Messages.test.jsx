import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Messages from '../screens/Messages'
import { ok, fail, renderApp } from './helpers'

vi.mock('../lib/db')
import * as db from '../lib/db'

const conv = {
  id: 'conv-1',
  user1_id: 'me-1',
  user2_id: 'other-1',
  last_message: 'Договорились',
  last_msg_at: new Date().toISOString(),
  p1: { id: 'me-1', full_name: 'Ахметов Ерлан', position: 'Слесарь КИПиА', dzo: 'АО «Орталык»' },
  p2: { id: 'other-1', full_name: 'Бекова Айгуль', position: 'Технолог', dzo: 'АО «СП «Инкай»' },
}

const message = (over = {}) => ({
  id: 'm-1',
  conversation_id: 'conv-1',
  sender_id: 'other-1',
  body: 'Здравствуйте!',
  read: false,
  created_at: new Date().toISOString(),
  ...over,
})

beforeEach(() => {
  db.listConversations.mockResolvedValue({ data: [conv], error: null })
  db.listMessages.mockResolvedValue({ data: [message()], error: null })
  db.markMessagesRead.mockReturnValue(ok(null))
  db.sendMessage.mockReturnValue(ok(message({ id: 'm-2', sender_id: 'me-1', body: 'Добрый день' })))
  db.openConversation.mockReturnValue(ok('conv-1'))
  db.searchPeopleByName.mockReturnValue(
    ok([{ id: 'other-2', full_name: 'Сериков Данияр', position: 'Механик', dzo: 'АО «Орталык»' }]),
  )
  db.subscribeToMessages.mockReturnValue(() => {})
})

const view = (props = {}) => renderApp(<Messages myId="me-1" onOpenProfile={() => {}} {...props} />)

describe('Сообщения', () => {
  it('показывает диалог с собеседником, а не с собой', async () => {
    view()
    expect(await screen.findByText('Бекова Айгуль')).toBeInTheDocument()
    expect(screen.getByText('Договорились')).toBeInTheDocument()
    expect(screen.queryByText('Ахметов Ерлан')).not.toBeInTheDocument()
  })

  it('открывает переписку по клику', async () => {
    const { user } = view()
    await user.click(await screen.findByText('Бекова Айгуль'))

    expect(await screen.findByText('Здравствуйте!')).toBeInTheDocument()
    expect(db.listMessages).toHaveBeenCalledWith('conv-1')
    // Входящие сразу помечаются прочитанными
    expect(db.markMessagesRead).toHaveBeenCalledWith('conv-1', 'me-1')
  })

  it('отправляет сообщение и очищает поле', async () => {
    const { user } = view()
    await user.click(await screen.findByText('Бекова Айгуль'))

    const input = await screen.findByLabelText('Текст сообщения')
    await user.type(input, 'Добрый день')
    await user.click(screen.getByRole('button', { name: 'Отправить' }))

    await waitFor(() =>
      expect(db.sendMessage).toHaveBeenCalledWith('conv-1', 'me-1', 'Добрый день'),
    )
    await waitFor(() => expect(input).toHaveValue(''))
  })

  it('при сбое отправки сохраняет набранный текст', async () => {
    // Раньше поле очищалось до запроса, и сообщение исчезало без следа.
    db.sendMessage.mockReturnValue(fail('Нет связи с сервером. Проверьте интернет.'))
    const { user } = view()
    await user.click(await screen.findByText('Бекова Айгуль'))

    const input = await screen.findByLabelText('Текст сообщения')
    await user.type(input, 'Важное сообщение')
    await user.click(screen.getByRole('button', { name: 'Отправить' }))

    expect(await screen.findByText(/Нет связи с сервером/)).toBeInTheDocument()
    expect(input).toHaveValue('Важное сообщение')
  })

  it('открывает диалог через атомарную RPC, а не поиском с последующей вставкой', async () => {
    const { user } = view()
    await user.click(await screen.findByRole('button', { name: 'Новое сообщение' }))
    await user.type(screen.getByLabelText('Поиск сотрудника'), 'Сериков')

    await user.click(await screen.findByText('Сериков Данияр'))
    await waitFor(() => expect(db.openConversation).toHaveBeenCalledWith('other-2'))
  })

  it('сразу открывает переписку, если пришли из чужого профиля', async () => {
    const onStartHandled = vi.fn()
    view({ startWith: { id: 'other-1', full_name: 'Бекова Айгуль' }, onStartHandled })

    await waitFor(() => expect(db.openConversation).toHaveBeenCalledWith('other-1'))
    expect(await screen.findByLabelText('Текст сообщения')).toBeInTheDocument()
  })

  it('фильтрует список диалогов', async () => {
    const { user } = view()
    await screen.findByText('Бекова Айгуль')

    await user.type(screen.getByLabelText('Поиск по диалогам'), 'Сериков')
    expect(await screen.findByText(/диалогов нет/)).toBeInTheDocument()
  })

  it('показывает пустое состояние без диалогов', async () => {
    db.listConversations.mockResolvedValue({ data: [], error: null })
    view()
    expect(await screen.findByText('Нет диалогов')).toBeInTheDocument()
  })
})
