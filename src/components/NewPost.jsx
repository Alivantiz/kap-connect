import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { IconClose, IconCase, IconQuestion } from '../components/Icons'

export default function NewPost({ myId, onClose, onPosted }) {
  const [type, setType] = useState('post')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const publish = async () => {
    if (!title.trim()) { setError('Заголовок обязателен'); return }
    setSaving(true)
    const { error: e } = await supabase.from('posts').insert({
      author_id: myId,
      type,
      title: title.trim(),
      body: body.trim() || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setSaving(false)
    if (e) { setError(e.message); return }
    onPosted()
  }

  const hint = {
    post: 'Поделитесь новостью, мыслью или достижением',
    case: 'Опишите проблему и как вы её решили — это останется в базе опыта',
    question: 'Опишите ситуацию — коллеги из других ДЗО подскажут',
  }[type]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Новая публикация
          <button className="icon-btn" onClick={onClose}><IconClose size={18} /></button>
        </div>

        <div className="type-row">
          <button className={`type-opt ${type==='post'?'sel':''}`} onClick={() => setType('post')}>Пост</button>
          <button className={`type-opt ${type==='case'?'sel':''}`} onClick={() => setType('case')}>Кейс</button>
          <button className={`type-opt ${type==='question'?'sel':''}`} onClick={() => setType('question')}>Вопрос</button>
        </div>

        <div style={{fontSize:12, color:'var(--text3)', marginBottom:12}}>{hint}</div>

        {error && <div className="auth-error">{error}</div>}

        <div className="field">
          <label>Заголовок</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder={type === 'question' ? 'Кто сталкивался с...' : type === 'case' ? 'Как мы решили проблему с...' : 'О чём расскажете?'} />
        </div>
        <div className="field">
          <label>Текст</label>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder={type === 'case' ? 'Ситуация → Что пробовали → Что сработало' : 'Подробности...'} />
        </div>
        <div className="field">
          <label>Теги (через запятую)</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="насосы, Siemens, бурение" />
        </div>

        <button className="btn-primary" style={{margin:'4px 0 0', width:'100%'}} disabled={saving} onClick={publish}>
          {saving ? 'Публикуем...' : 'Опубликовать'}
        </button>
      </div>
    </div>
  )
}
