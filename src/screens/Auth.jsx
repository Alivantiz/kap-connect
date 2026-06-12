import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Icons'

const DZO_LIST = ['Орталык', 'Инкай', 'Байкен-У', 'Катко', 'Каратау', 'РУ-6', 'Аппак', 'СП Заречное', 'Семизбай-U', 'Головной офис', 'Другое']

export default function Auth() {
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [dzo, setDzo] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        if (!fullName.trim()) throw new Error('Укажите имя и фамилию')
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          const { error: pErr } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName.trim(),
            dzo: dzo || null,
            specialty: specialty.trim() || null,
          })
          if (pErr) throw pErr
        }
      }
    } catch (e) {
      setError(e.message === 'Invalid login credentials'
        ? 'Неверный email или пароль'
        : e.message)
    }
    setLoading(false)
  }

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

      {mode === 'signup' && (
        <>
          <div className="field">
            <label>Имя и фамилия</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Аскар Сулейменов" />
          </div>
          <div className="field">
            <label>ДЗО</label>
            <select value={dzo} onChange={e => setDzo(e.target.value)}>
              <option value="">— выберите —</option>
              {DZO_LIST.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Специальность</label>
            <input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="КИПиА, буровик, механик..." />
          </div>
        </>
      )}

      <div className="field">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@mail.kz" />
      </div>
      <div className="field">
        <label>Пароль</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="минимум 6 символов" />
      </div>

      <button className="btn-primary" style={{margin:'8px 0 0', width:'100%'}} disabled={loading} onClick={submit}>
        {loading ? '...' : mode === 'signin' ? 'Войти' : 'Создать аккаунт'}
      </button>

      <div className="auth-switch">
        {mode === 'signin'
          ? <>Нет аккаунта? <span onClick={() => setMode('signup')}>Зарегистрироваться</span></>
          : <>Уже есть аккаунт? <span onClick={() => setMode('signin')}>Войти</span></>}
      </div>
    </div>
  )
}
