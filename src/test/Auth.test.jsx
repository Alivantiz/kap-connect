import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Auth from '../screens/Auth'
import { ok, fail, renderApp } from './helpers'

vi.mock('../lib/db')
import * as db from '../lib/db'

beforeEach(() => {
  db.listDzo.mockReturnValue(ok(['АО «Орталык»', 'АО «СП «Инкай»']))
  // db.auth автоматически замокан целиком — методы просто настраиваются.
  db.auth.signIn.mockImplementation(() => ok({ session: {} }))
  db.auth.signUp.mockImplementation(() => ok({ session: {} }))
  db.auth.resetPassword.mockImplementation(() => ok({}))
})

describe('Вход и регистрация', () => {
  it('входит по заполненной форме', async () => {
    const { user } = renderApp(<Auth />)

    await user.type(screen.getByLabelText(/Email/), 'erlan@kazatomprom.kz')
    await user.type(screen.getByLabelText(/^Пароль/), 'nadezhno99')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() =>
      expect(db.auth.signIn).toHaveBeenCalledWith('erlan@kazatomprom.kz', 'nadezhno99'),
    )
  })

  it('отправляется по Enter — форма настоящая, а не набор полей', async () => {
    // Раньше разметка не была <form>, и клавиша Enter ничего не делала.
    const { user } = renderApp(<Auth />)
    await user.type(screen.getByLabelText(/Email/), 'a@b.kz')
    await user.type(screen.getByLabelText(/^Пароль/), 'nadezhno99{Enter}')
    await waitFor(() => expect(db.auth.signIn).toHaveBeenCalled())
  })

  it('показывает ошибку сервера человеческим текстом', async () => {
    db.auth.signIn.mockImplementation(() => fail('Неверный email или пароль'))
    const { user } = renderApp(<Auth />)

    await user.type(screen.getByLabelText(/Email/), 'a@b.kz')
    await user.type(screen.getByLabelText(/^Пароль/), 'nadezhno99')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный email или пароль')
  })

  it('не пускает дальше с коротким паролем и не шлёт запрос', async () => {
    const { user } = renderApp(<Auth />)
    await user.type(screen.getByLabelText(/Email/), 'a@b.kz')
    await user.type(screen.getByLabelText(/^Пароль/), '123')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Минимум 8 символов')).toBeInTheDocument()
    expect(db.auth.signIn).not.toHaveBeenCalled()
  })

  it('в регистрации требует ФИО, предприятие и совпадение паролей', async () => {
    const { user } = renderApp(<Auth />)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await user.type(screen.getByLabelText(/Фамилия/), 'Ахметов')
    await user.type(screen.getByLabelText(/^Имя/), 'Ерлан')
    await user.type(screen.getByLabelText(/Email/), 'erlan@kazatomprom.kz')
    await user.type(screen.getByLabelText(/^Пароль/), 'nadezhno99')
    await user.type(screen.getByLabelText(/Повторите пароль/), 'drugoy99')
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }))

    expect(await screen.findByText('Пароли не совпадают')).toBeInTheDocument()
    expect(db.auth.signUp).not.toHaveBeenCalled()
  })

  it('регистрирует и склеивает ФИО в одну строку', async () => {
    const { user } = renderApp(<Auth />)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))
    await screen.findByLabelText(/Предприятие/)

    await user.type(screen.getByLabelText(/Фамилия/), 'Ахметов')
    await user.type(screen.getByLabelText(/^Имя/), 'Ерлан')
    await user.type(screen.getByLabelText(/Отчество/), 'Серикович')
    await user.selectOptions(screen.getByLabelText(/Предприятие/), 'АО «Орталык»')
    await user.type(screen.getByLabelText(/Email/), 'erlan@kazatomprom.kz')
    await user.type(screen.getByLabelText(/^Пароль/), 'nadezhno99')
    await user.type(screen.getByLabelText(/Повторите пароль/), 'nadezhno99')
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }))

    await waitFor(() =>
      expect(db.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Ахметов Ерлан Серикович',
          dzo: 'АО «Орталык»',
        }),
      ),
    )
  })

  it('умеет восстановить пароль', async () => {
    const { user } = renderApp(<Auth />)
    await user.click(screen.getByRole('button', { name: 'Забыли пароль?' }))
    await user.type(screen.getByLabelText(/Email/), 'erlan@kazatomprom.kz')
    await user.click(screen.getByRole('button', { name: 'Отправить письмо' }))

    await waitFor(() => expect(db.auth.resetPassword).toHaveBeenCalledWith('erlan@kazatomprom.kz'))
    expect(await screen.findByText(/Письмо для сброса пароля отправлено/)).toBeInTheDocument()
  })
})
