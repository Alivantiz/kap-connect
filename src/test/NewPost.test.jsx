import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NewPost from '../components/NewPost'
import { ok, fail, renderApp } from './helpers'

vi.mock('../lib/db')
import * as db from '../lib/db'

beforeEach(() => {
  db.createPost.mockReturnValue(ok({ id: 'p-new' }))
})

describe('Новая публикация', () => {
  it('не публикует без заголовка', async () => {
    const { user } = renderApp(<NewPost myId="me-1" onClose={() => {}} onPosted={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Опубликовать' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Заголовок обязателен')
    expect(db.createPost).not.toHaveBeenCalled()
  })

  it('переключает тип и меняет подсказку', async () => {
    const { user } = renderApp(<NewPost myId="me-1" onClose={() => {}} onPosted={() => {}} />)
    await user.click(screen.getByRole('radio', { name: /Вопрос/ }))

    expect(screen.getByRole('radio', { name: /Вопрос/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText(/подскажут коллеги/i)).toBeInTheDocument()
  })

  it('публикует кейс и нормализует теги', async () => {
    const onPosted = vi.fn()
    const { user } = renderApp(<NewPost myId="me-1" onClose={() => {}} onPosted={onPosted} />)

    await user.click(screen.getByRole('radio', { name: /Кейс/ }))
    await user.type(screen.getByLabelText(/Заголовок/), 'Течь по валу насоса')
    await user.type(screen.getByLabelText(/Текст/), 'Заменили торцевое уплотнение.')
    await user.type(screen.getByLabelText(/Теги/), 'Насосы, насосы, ГрАТ')
    await user.click(screen.getByRole('button', { name: 'Опубликовать' }))

    await waitFor(() =>
      expect(db.createPost).toHaveBeenCalledWith({
        author_id: 'me-1',
        type: 'case',
        title: 'Течь по валу насоса',
        body: 'Заменили торцевое уплотнение.',
        // Дубли сняты, регистр приведён: иначе «Насосы» и «насосы»
        // навсегда остаются разными тегами.
        tags: ['насосы', 'грат'],
      }),
    )
    expect(onPosted).toHaveBeenCalled()
  })

  it('показывает ошибку сервера и не закрывает окно', async () => {
    db.createPost.mockReturnValue(fail('Недостаточно прав для этого действия'))
    const onPosted = vi.fn()
    const { user } = renderApp(<NewPost myId="me-1" onClose={() => {}} onPosted={onPosted} />)

    await user.type(screen.getByLabelText(/Заголовок/), 'Тест')
    await user.click(screen.getByRole('button', { name: 'Опубликовать' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Недостаточно прав')
    expect(onPosted).not.toHaveBeenCalled()
  })
})
