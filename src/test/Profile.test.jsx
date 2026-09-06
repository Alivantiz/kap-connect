import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Profile from '../screens/Profile'
import { ok, fail, profileFixture, renderApp } from './helpers'

vi.mock('../lib/db')
import * as db from '../lib/db'

beforeEach(() => {
  db.getProfile.mockReturnValue(ok(profileFixture()))
  db.getProfileStats.mockReturnValue(ok({ posts_count: 4, answers_count: 9, solutions_count: 2 }))
  db.listDzo.mockReturnValue(ok(['АО «Орталык»', 'АО «СП «Инкай»']))
  db.updateProfile.mockReturnValue(ok(profileFixture({ position: 'Мастер КИПиА' })))
})

describe('Профиль', () => {
  it('показывает данные, статистику и навыки', async () => {
    renderApp(<Profile profileId="me-1" isMe />)
    expect(
      await screen.findByRole('heading', { name: 'Ахметов Ерлан Серикович' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Слесарь КИПиА')).toBeInTheDocument()
    expect(screen.getByText('TIA Portal')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('решений')).toBeInTheDocument()
    // ДЗО показывается в короткой форме
    expect(screen.getByText(/Орталык/)).toBeInTheDocument()
  })

  it('на чужом профиле есть кнопка «Написать сообщение»', async () => {
    // Раньше App передавал onMessage, но Profile этот проп не принимал —
    // написать человеку из профиля было нельзя вовсе.
    const onMessage = vi.fn()
    db.getProfile.mockReturnValue(ok(profileFixture({ id: 'other-1' })))
    const { user } = renderApp(<Profile profileId="other-1" isMe={false} onMessage={onMessage} />)

    await user.click(await screen.findByRole('button', { name: /Написать сообщение/ }))
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 'other-1' }))
  })

  it('на своём профиле кнопки сообщения нет, есть выход', async () => {
    renderApp(<Profile profileId="me-1" isMe />)
    await screen.findByRole('heading', { name: /Ахметов/ })
    expect(screen.queryByRole('button', { name: /Написать сообщение/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Выйти/ })).toBeInTheDocument()
  })

  it('сохраняет правки профиля', async () => {
    const { user } = renderApp(<Profile profileId="me-1" isMe />)
    await user.click(await screen.findByRole('button', { name: /Редактировать профиль/ }))

    const role = await screen.findByLabelText(/Должность/)
    await user.clear(role)
    await user.type(role, 'Мастер КИПиА')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(db.updateProfile).toHaveBeenCalledWith(
        'me-1',
        expect.objectContaining({ position: 'Мастер КИПиА', specialty: 'Мастер КИПиА' }),
      ),
    )
  })

  it('не даёт сохранить стаж вне допустимого диапазона', async () => {
    const { user } = renderApp(<Profile profileId="me-1" isMe />)
    await user.click(await screen.findByRole('button', { name: /Редактировать профиль/ }))

    const years = await screen.findByLabelText(/Стаж/)
    await user.clear(years)
    await user.type(years, '120')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Стаж — число от 0 до 70')
    expect(db.updateProfile).not.toHaveBeenCalled()
  })

  it('в списке предприятий остаётся текущее, даже если справочник его не вернул', async () => {
    // Иначе select показывал пустое значение и любое касание стирало ДЗО.
    db.listDzo.mockReturnValue(ok(['АО «СП «Инкай»']))
    const { user } = renderApp(<Profile profileId="me-1" isMe />)
    await user.click(await screen.findByRole('button', { name: /Редактировать профиль/ }))

    const select = await screen.findByLabelText(/Предприятие/)
    await waitFor(() => expect(select).toHaveValue('АО «Орталык»'))
  })

  it('показывает понятную ошибку, если профиля нет', async () => {
    // Раньше экран крутил спиннер бесконечно и выйти из него было нельзя.
    db.getProfile.mockReturnValue(ok(null))
    renderApp(<Profile profileId="me-1" isMe />)
    expect(await screen.findByText('Профиль недоступен')).toBeInTheDocument()
  })

  it('«Повторить» действительно перезапрашивает профиль', async () => {
    // Кнопка только сбрасывала текст ошибки, запрос не повторялся,
    // и экран навсегда оставался на скелетоне.
    db.getProfile.mockReturnValueOnce(fail('Нет связи с сервером. Проверьте интернет.'))
    db.getProfile.mockReturnValue(ok(profileFixture()))
    const { user } = renderApp(<Profile profileId="me-1" isMe />)

    await user.click(await screen.findByRole('button', { name: 'Повторить' }))

    expect(db.getProfile).toHaveBeenCalledTimes(2)
    expect(await screen.findByRole('heading', { name: /Ахметов/ })).toBeInTheDocument()
  })

  it('показывает ошибку загрузки', async () => {
    db.getProfile.mockReturnValue(fail('Нет связи с сервером. Проверьте интернет.'))
    renderApp(<Profile profileId="me-1" isMe />)
    expect(await screen.findByText(/Нет связи с сервером/)).toBeInTheDocument()
  })
})
