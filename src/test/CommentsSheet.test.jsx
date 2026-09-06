import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommentsSheet from '../components/CommentsSheet'
import { ok, fail, postFixture, renderApp } from './helpers'

vi.mock('../lib/db')
import * as db from '../lib/db'

const comment = (over = {}) => ({
  id: 'cm-1',
  post_id: 'p-1',
  author_id: 'other-2',
  body: 'Проверьте зазор в подшипнике.',
  is_solution: false,
  created_at: new Date().toISOString(),
  profiles: {
    id: 'other-2',
    full_name: 'Сериков Данияр',
    position: 'Механик',
    dzo: 'АО «Орталык»',
  },
  ...over,
})

beforeEach(() => {
  db.listComments.mockResolvedValue({ data: [comment()], error: null })
  db.addComment.mockReturnValue(ok({ id: 'cm-new' }))
  db.markSolution.mockReturnValue(ok(null))
  db.deleteComment.mockReturnValue(ok(null))
})

const view = (post, myId = 'me-1') =>
  renderApp(<CommentsSheet post={post} myId={myId} onClose={() => {}} onOpenProfile={() => {}} />)

describe('Ответы', () => {
  it('показывает цитату публикации и список ответов', async () => {
    view(postFixture({ type: 'question' }))
    expect(await screen.findByText('Проверьте зазор в подшипнике.')).toBeInTheDocument()
    expect(screen.getByText('Сериков Данияр')).toBeInTheDocument()
    expect(screen.getByText('Замена уплотнения насоса ГрАТ')).toBeInTheDocument()
  })

  it('отправляет ответ и очищает поле', async () => {
    const { user } = view(postFixture())
    const input = await screen.findByLabelText('Текст ответа')

    await user.type(input, 'Так и сделали, спасибо.')
    await user.click(screen.getByRole('button', { name: 'Отправить ответ' }))

    await waitFor(() =>
      expect(db.addComment).toHaveBeenCalledWith('p-1', 'me-1', 'Так и сделали, спасибо.'),
    )
    await waitFor(() => expect(input).toHaveValue(''))
  })

  it('отправляет ответ по Enter', async () => {
    const { user } = view(postFixture())
    const input = await screen.findByLabelText('Текст ответа')
    await user.type(input, 'Коротко{Enter}')
    await waitFor(() => expect(db.addComment).toHaveBeenCalled())
  })

  it('сообщает об ошибке отправки и не чистит поле', async () => {
    db.addComment.mockReturnValue(fail('Нет связи с сервером. Проверьте интернет.'))
    const { user } = view(postFixture())
    const input = await screen.findByLabelText('Текст ответа')

    await user.type(input, 'Мой ответ')
    await user.click(screen.getByRole('button', { name: 'Отправить ответ' }))

    expect(await screen.findByText(/Нет связи с сервером/)).toBeInTheDocument()
    expect(input).toHaveValue('Мой ответ')
  })

  it('автор вопроса отмечает ответ решением через RPC', async () => {
    // Прямой update отклоняла политика RLS — обе операции молча не проходили,
    // и кнопка выглядела мёртвой.
    const { user } = view(postFixture({ type: 'question', author_id: 'me-1' }))
    await user.click(await screen.findByRole('button', { name: /Решение/ }))
    await waitFor(() => expect(db.markSolution).toHaveBeenCalledWith('cm-1'))
  })

  it('кнопка «Решение» видна автору вопроса', async () => {
    view(postFixture({ type: 'question', author_id: 'me-1' }))
    await screen.findByText('Проверьте зазор в подшипнике.')
    expect(screen.getByRole('button', { name: /Решение/ })).toBeInTheDocument()
  })

  it('кнопка «Решение» скрыта в обычном посте', async () => {
    view(postFixture({ type: 'post', author_id: 'me-1' }))
    await screen.findByText('Проверьте зазор в подшипнике.')
    expect(screen.queryByRole('button', { name: /Решение/ })).not.toBeInTheDocument()
  })

  it('кнопка «Решение» скрыта у чужого вопроса', async () => {
    view(postFixture({ type: 'question', author_id: 'other-9' }))
    await screen.findByText('Проверьте зазор в подшипнике.')
    expect(screen.queryByRole('button', { name: /Решение/ })).not.toBeInTheDocument()
  })

  it('отмеченный ответ помечен значком', async () => {
    db.listComments.mockResolvedValue({ data: [comment({ is_solution: true })], error: null })
    view(postFixture({ type: 'question' }))
    expect(await screen.findByText('Решение')).toBeInTheDocument()
  })

  it('свой ответ можно удалить', async () => {
    db.listComments.mockResolvedValue({ data: [comment({ author_id: 'me-1' })], error: null })
    const { user } = view(postFixture())
    await user.click(await screen.findByRole('button', { name: 'Удалить ответ' }))
    await waitFor(() => expect(db.deleteComment).toHaveBeenCalledWith('cm-1'))
  })
})
