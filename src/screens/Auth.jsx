import { useEffect, useState } from 'react'
import { auth, listDzo } from '../lib/db'
import { isValidEmail } from '../lib/format'
import { Logo, IconAlert, IconCheckCircle, IconBack } from '../components/Icons'
import { TextField, SelectField } from '../components/ui/Field'
import Button from '../components/ui/Button'

const MIN_PASSWORD = 8

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [dzoList, setDzoList] = useState([])
  const [f, setF] = useState({
    email: '',
    password: '',
    password2: '',
    lastName: '',
    firstName: '',
    middleName: '',
    dzo: '',
    specialty: '',
  })
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    let alive = true
    listDzo().then(({ data }) => {
      if (alive && data) setDzoList(data)
    })
    return () => {
      alive = false
    }
  }, [])

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  const blur = (k) => () => setTouched((p) => ({ ...p, [k]: true }))

  // Проверки считаются на каждый рендер, но показываются только после
  // расфокуса поля — иначе форма краснеет ещё до первого ввода.
  const errors = {}
  if (!isValidEmail(f.email)) errors.email = 'Введите корректный email'
  if (mode !== 'reset') {
    if (f.password.length < MIN_PASSWORD) errors.password = `Минимум ${MIN_PASSWORD} символов`
  }
  if (mode === 'signup') {
    if (!f.lastName.trim()) errors.lastName = 'Укажите фамилию'
    if (!f.firstName.trim()) errors.firstName = 'Укажите имя'
    if (f.password2 !== f.password) errors.password2 = 'Пароли не совпадают'
    if (!f.dzo) errors.dzo = 'Выберите предприятие'
  }
  const show = (k) => (touched[k] ? errors[k] : undefined)
  const valid = Object.keys(errors).length === 0

  const submit = async (e) => {
    e?.preventDefault()
    setError('')
    setInfo('')
    if (!valid) {
      // Подсвечиваем всё, что не заполнено, вместо молчаливого бездействия.
      setTouched(Object.fromEntries(Object.keys(errors).map((k) => [k, true])))
      setError('Проверьте выделенные поля')
      return
    }
    setLoading(true)

    if (mode === 'reset') {
      const { error: e2 } = await auth.resetPassword(f.email)
      setLoading(false)
      if (e2) return setError(e2)
      return setInfo('Письмо для сброса пароля отправлено. Проверьте почту.')
    }

    if (mode === 'signin') {
      const { error: e2 } = await auth.signIn(f.email, f.password)
      setLoading(false)
      if (e2) setError(e2)
      return
    }

    const full_name = [f.lastName, f.firstName, f.middleName]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' ')
    const { data, error: e2 } = await auth.signUp({
      email: f.email,
      password: f.password,
      full_name,
      dzo: f.dzo,
      specialty: f.specialty.trim(),
    })
    setLoading(false)
    if (e2) return setError(e2)
    if (!data?.session) {
      setInfo('Аккаунт создан. Подтвердите email по ссылке из письма и войдите.')
      setMode('signin')
      setTouched({})
    }
  }

  const go = (m) => {
    setMode(m)
    setError('')
    setInfo('')
    setTouched({})
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <Logo size={40} />
          <div className="auth-word">
            KAP<span className="dot">.</span>Connect
          </div>
        </div>
        <p className="auth-lead">
          {mode === 'reset'
            ? 'Укажите email — пришлём ссылку для восстановления доступа.'
            : 'Профессиональная сеть сотрудников Казатомпрома. Кейсы, вопросы и поиск экспертов по всем предприятиям группы.'}
        </p>

        {error && (
          <div className="banner banner-error" role="alert">
            <IconAlert size={17} />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="banner banner-ok" role="status">
            <IconCheckCircle size={17} />
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={submit} noValidate>
          {mode === 'signup' && (
            <>
              <div className="grid-2">
                <TextField
                  label="Фамилия"
                  required
                  autoComplete="family-name"
                  placeholder="Ахметов"
                  value={f.lastName}
                  onChange={set('lastName')}
                  onBlur={blur('lastName')}
                  error={show('lastName')}
                />
                <TextField
                  label="Имя"
                  required
                  autoComplete="given-name"
                  placeholder="Ерлан"
                  value={f.firstName}
                  onChange={set('firstName')}
                  onBlur={blur('firstName')}
                  error={show('firstName')}
                />
              </div>
              <TextField
                label="Отчество"
                autoComplete="additional-name"
                placeholder="Серикович"
                value={f.middleName}
                onChange={set('middleName')}
              />
              <SelectField
                label="Предприятие"
                required
                options={dzoList}
                placeholder="— выберите предприятие —"
                value={f.dzo}
                onChange={set('dzo')}
                onBlur={blur('dzo')}
                error={show('dzo')}
              />
              <TextField
                label="Должность"
                placeholder="Слесарь КИПиА, буровой мастер, технолог"
                hint="Поможет коллегам найти вас в поиске экспертов"
                value={f.specialty}
                onChange={set('specialty')}
              />
            </>
          )}

          <TextField
            label="Email"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@kazatomprom.kz"
            value={f.email}
            onChange={set('email')}
            onBlur={blur('email')}
            error={show('email')}
          />

          {mode !== 'reset' && (
            <TextField
              label="Пароль"
              required
              type="password"
              placeholder={`Минимум ${MIN_PASSWORD} символов`}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={f.password}
              onChange={set('password')}
              onBlur={blur('password')}
              error={show('password')}
            />
          )}

          {mode === 'signup' && (
            <TextField
              label="Повторите пароль"
              required
              type="password"
              autoComplete="new-password"
              placeholder="Ещё раз"
              value={f.password2}
              onChange={set('password2')}
              onBlur={blur('password2')}
              error={show('password2')}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2"
          >
            {mode === 'signin'
              ? 'Войти'
              : mode === 'signup'
                ? 'Создать аккаунт'
                : 'Отправить письмо'}
          </Button>
        </form>

        <div className="auth-links">
          {mode === 'signin' && (
            <>
              <button type="button" className="link" onClick={() => go('reset')}>
                Забыли пароль?
              </button>
              <span className="auth-sep">
                Нет аккаунта?{' '}
                <button type="button" className="link link-strong" onClick={() => go('signup')}>
                  Зарегистрироваться
                </button>
              </span>
            </>
          )}
          {mode === 'signup' && (
            <span className="auth-sep">
              Уже есть аккаунт?{' '}
              <button type="button" className="link link-strong" onClick={() => go('signin')}>
                Войти
              </button>
            </span>
          )}
          {mode === 'reset' && (
            <button type="button" className="link link-back" onClick={() => go('signin')}>
              <IconBack size={15} /> Назад ко входу
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
