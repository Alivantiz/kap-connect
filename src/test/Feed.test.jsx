import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Feed from '../screens/Feed'
import { ok, fail, postFixture, profileFixture, renderApp } from './helpers'

vi.mock('../lib/db')
import * as db from '../lib/db'

const me = profileFixture()

beforeEach(() => {
  db.listFeed.mockResolvedValue({ data: [postFixture()], error: null })
  db.myLikedPostIds.mockResolvedValue({ data: new Set(), error: null })
  db.likePost.mockReturnValue(ok(null))
  db.unlikePost.mockReturnValue(ok(null))
  db.deletePost.mockReturnValue(ok(null))
  db.listComments.mockReturnValue(ok([]))
})

const view = (props = {}) =>
  renderApp(<Feed myId="me-1" myProfile={me} onOpenProfile={() => {}} {...props} />)

describe('Лента', () => {
  it('показывает публикацию с типом, автором и тегами', async () => {
    view()
    expect(await screen.findByText('Замена уплотнения насоса ГрАТ')).toBeInTheDocument()
    expect(screen.getByText('Бекова Айгуль')).toBeInTheDocument()
    expect(screen.getByText('Кейс')).toBeInTheDocument()
    expect(screen.getByText('#насосы')).toBeInTheDocument()
    // ДЗО приводится к короткой форме
    expect(screen.getByText(/Инкай/)).toBeInTheDocument()
  })

  it('лайк по клику увеличивает счётчик и отправляет запрос', async () => {
    const { user } = view()
    await screen.findByText('Замена уплотнения насоса ГрАТ')

    const like = screen.getByRole('button', { name: /Отметить как полезное/i })
    expect(like).toHaveAttribute('aria-pressed', 'false')

    await user.click(like)

    expect(db.likePost).toHaveBeenCalledWith('p-1', 'me-1')
    await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Убрать отметку/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('откатывает лайк и показывает ошибку, если запрос не прошёл', async () => {
    // Раньше результат запроса выбрасывался: сердечко оставалось закрашенным,
    // и пользователь считал, что отметка сохранилась.
    db.likePost.mockReturnValue(fail('Нет связи с сервером. Проверьте интернет.'))
    const { user } = view()
    await screen.findByText('Замена уплотнения насоса ГрАТ')

    await user.click(screen.getByRole('button', { name: /Отметить как полезное/i }))

    expect(await screen.findByText('Нет связи с сервером. Проверьте интернет.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Отметить как полезное/i })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('не шлёт два запроса на двойной клик по лайку', async () => {
    let resolveLike
    db.likePost.mockReturnValue(
      new Promise((r) => {
        resolveLike = r
      }),
    )
    const { user } = view()
    await screen.findByText('Замена уплотнения насоса ГрАТ')

    const like = screen.getByRole('button', { name: /Отметить как полезное/i })
    await user.click(like)
    await user.click(screen.getByRole('button', { name: /Убрать отметку/i }))

    expect(db.likePost).toHaveBeenCalledTimes(1)
    expect(db.unlikePost).not.toHaveBeenCalled()
    resolveLike({ data: null, error: null })
  })

  it('переключение фильтра перезапрашивает ленту с новым параметром', async () => {
    const { user } = view()
    await screen.findByText('Замена уплотнения насоса ГрАТ')

    await user.click(screen.getByRole('button', { name: 'Вопросы' }))

    await waitFor(() =>
      expect(db.listFeed).toHaveBeenCalledWith(expect.objectContaining({ filter: 'questions' })),
    )
  })

  it('фильтр по предприятию недоступен, пока в профиле не указано ДЗО', async () => {
    const onNeedProfile = vi.fn()
    const { user } = renderApp(
      <Feed
        myId="me-1"
        myProfile={profileFixture({ dzo: null, position: null, specialty: null })}
        onOpenProfile={() => {}}
        onNeedProfile={onNeedProfile}
      />,
    )
    await screen.findByText('Замена уплотнения насоса ГрАТ')

    await user.click(screen.getByRole('button', { name: 'Моё ДЗО' }))

    // Раньше фильтр молча показывал всю ленту компании под заголовком «Моё ДЗО».
    expect(onNeedProfile).toHaveBeenCalled()
    expect(db.listFeed).not.toHaveBeenCalledWith(expect.objectContaining({ filter: 'dzo' }))
  })

  it('показывает пустое состояние, когда публикаций нет', async () => {
    db.listFeed.mockResolvedValue({ data: [], error: null })
    view()
    expect(await screen.findByText('Пока пусто')).toBeInTheDocument()
  })

  it('показывает ошибку загрузки с кнопкой повтора', async () => {
    db.listFeed.mockResolvedValue({ data: null, error: 'Недостаточно прав для этого действия' })
    const { user } = view()

    expect(await screen.findByText('Не удалось загрузить ленту')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(db.listFeed).toHaveBeenCalledTimes(2)
  })

  it('открывает окно ответов по клику', async () => {
    const { user } = view()
    await screen.findByText('Замена уплотнения насоса ГрАТ')

    await user.click(screen.getByRole('button', { name: /^1$/ }))

    expect(await screen.findByRole('dialog', { name: 'Ответы' })).toBeInTheDocument()
    expect(db.listComments).toHaveBeenCalledWith('p-1')
  })

  it('длинный кейс можно раскрыть целиком', async () => {
    const long = 'А'.repeat(600)
    db.listFeed.mockResolvedValue({ data: [postFixture({ body: long })], error: null })
    const { user } = view()

    const toggle = await screen.findByRole('button', { name: 'Показать полностью' })
    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Свернуть' })).toBeInTheDocument()
  })

  it('сообщает, если удаление не прошло, и оставляет карточку', async () => {
    // Удаление без ответа строк раньше молча «удаляло» карточку из списка.
    db.listFeed.mockResolvedValue({ data: [postFixture({ author_id: 'me-1' })], error: null })
    db.deletePost.mockReturnValue(fail('Недостаточно прав для этого действия'))
    const { user } = view()
    await screen.findByText('Замена уплотнения насоса ГрАТ')

    await user.click(screen.getByRole('button', { name: 'Удалить публикацию' }))
    // Подтверждение — собственное окно приложения, а не системный диалог
    await user.click(await screen.findByRole('button', { name: 'Удалить' }))

    expect(await screen.findByText('Недостаточно прав для этого действия')).toBeInTheDocument()
    expect(screen.getByText('Замена уплотнения насоса ГрАТ')).toBeInTheDocument()
  })

  it('кнопка удаления есть только у своей публикации', async () => {
    db.listFeed.mockResolvedValue({ data: [postFixture({ author_id: 'me-1' })], error: null })
    view()
    await screen.findByText('Замена уплотнения насоса ГрАТ')
    expect(screen.getByRole('button', { name: 'Удалить публикацию' })).toBeInTheDocument()
  })
})
