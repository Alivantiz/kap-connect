import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Icons'

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [dzo, setDzo] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [dzoList, setDzoList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    supabase.from('dzo_list').select('name').order('sort')
      .then(({ data }) => setDzoList((data || []).map(d => d.name)))
  }, [])

  const submit = async () => {
    setError(''); setInfo('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        if (!lastName.trim() || !firstName.trim()) throw new Error('Укажите фамилию и имя')
        if (password.length < 6) throw new Error('Пароль минимум 6 символов')
        if (password !== password2) throw new Error('Пароли не совпадают')

        const full_name = [lastName, firstName, middleName]
          .map(s => s.trim()).filter(Boolean).join(' ')

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name, dzo, specialty: specialty.trim() } },
        })
        if (error) throw error

        if (!data.session) {
          setInfo('Аккаунт создан. Проверьте почту и подтвердите email, затем войдите.')
          setMode('signin')
        }
      }
    } catch (e) {
      setError(
        e.message === 'Invalid login credentials' ? 'Неверный email или пароль'
        : e.message === 'User already registered' ? 'Этот email уже зарегистрирован'
        : e.message
      )
    }
    setLoading(false)
  }

  const switchMode = (m) => { setMode(m); setError(''); setInfo(''); }

  return (
    <div className="auth-wrap">
      <div className="auth-logo">
        <Logo size={36} />
        <div className="auth-title">KAP<span style={{color:'var(--accent)'}}>.</span>Connect</div>
      </div>
      <div className="auth-sub">
        Профессиональная сеть сотрудников Казатомпрома.
        Кейсы, вопросы, поиск экспертов по всем ДЗО.
      </div>

      {error && <div className="auth-error">{error}</div>}
      {info && (
        <div className="auth-error" style={{
          background: 'rgba(61,190,122,0.12)',
          borderColor: 'rgba(61,190,122,0.3)',
          color: 'var(--green)'
        }}>{info}</div>
      )}

      {mode === 'signup' && (
        <>
          <div className="field">
            <label>Фамилия</label>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Фамилия"
              autoComplete="family-name"
            />
          </div>
          <div className="field">
            <label>Имя</label>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Имя"
              autoComplete="given-name"
            />
          </div>
          <div className="field">
            <label>
              Отчество{' '}
              <span style={{fontWeight:400, textTransform:'none', color:'var(--text3)'}}>
                (необязательно)
              </span>
            </label>
            <input
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
              placeholder="Отчество"
              autoComplete="additional-name"
            />
          </div>
          <div className="field">
            <label>ДЗО</label>
            <select value={dzo} onChange={e => setDzo(e.target.value)}>
              <option value="">— выберите ДЗО —</option>
              {dzoList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label>
              Специальность{' '}
              <span style={{fontWeight:400, textTransform:'none', color:'var(--text3)'}}>
                (необязательно)
              </span>
            </label>
            <input
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              placeholder="Например: КИПиА, буровик, механик"
            />
          </div>
        </>
      )}

      <div className="field">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
        />
      </div>
      <div className="field">
        <label>Пароль</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Минимум 6 символов"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        />
      </div>
      {mode === 'signup' && (
        <div className="field">
          <label>Подтверждение пароля</label>
          <input
            type="password"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            placeholder="Повторите пароль"
            autoComplete="new-password"
          />
        </div>
      )}

      <button
        className="btn-primary"
        style={{margin: '8px 0 0', width: '100%'}}
        disabled={loading}
        onClick={submit}
      >
        {loading ? '...' : mode === 'signin' ? 'Войти' : 'Создать аккаунт'}
      </button>

      <div className="auth-switch">
        {mode === 'signin'
          ? <>Нет аккаунта? <span onClick={() => switchMode('signup')}>Зарегистрироваться</span></>
          : <>Уже есть аккаунт? <span onClick={() => switchMode('signin')}>Войти</span></>
        }
      </div>
    </div>
  )
}
