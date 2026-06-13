import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Logo, IconFeed, IconSearch, IconGroups, IconProfile, IconPlus, IconBell } from './components/Icons'
import Auth from './screens/Auth'
import Feed from './screens/Feed'
import Search from './screens/Search'
import Communities from './screens/Communities'
import Profile from './screens/Profile'
import NewPost from './components/NewPost'

const AVA_COLORS = ['#3A6BA8', '#2E7D52', '#8B5E1A', '#5B3EA6', '#7A3030', '#1A6B6B', '#4A6B1A', '#6B1A5B']
const avaColor = (name) => AVA_COLORS[(name?.charCodeAt(0) || 0) % AVA_COLORS.length]
const initials = (name) => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

export default function App() {
  const [session, setSession] = useState(undefined)
  const [myProfile, setMyProfile] = useState(null)
  const [tab, setTab] = useState('feed')
  const [viewProfileId, setViewProfileId] = useState(null)
  const [showNewPost, setShowNewPost] = useState(false)
  const [feedKey, setFeedKey] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setMyProfile(null); return }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setMyProfile(data))
  }, [session])

  if (session === undefined) return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div className="spinner" />
    </div>
  )
  if (!session) return <Auth />

  const openProfile = (id) => { setViewProfileId(id); setTab('profile') }
  const goTab = (t) => { setViewProfileId(null); setTab(t) }
  const isProfileSelf = tab === 'profile' && !viewProfileId

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-logo">
          <Logo size={24} />
          KAP<span className="dot">.</span>Connect
        </div>
        <div className="topbar-actions">
          {myProfile && (
            <div
              className="ava topbar-ava"
              style={{ background: avaColor(myProfile.full_name) }}
              onClick={() => goTab('profile')}
            >
              {initials(myProfile.full_name)}
            </div>
          )}
        </div>
      </header>

      <main className="content">
        {tab === 'feed' && (
          <Feed key={feedKey} myId={session.user.id} onOpenProfile={openProfile} />
        )}
        {tab === 'search' && <Search onOpenProfile={openProfile} />}
        {tab === 'communities' && <Communities myId={session.user.id} />}
        {tab === 'profile' && (
          <Profile
            profileId={viewProfileId || session.user.id}
            isMe={!viewProfileId || viewProfileId === session.user.id}
            onBack={viewProfileId ? () => { setViewProfileId(null); setTab('feed') } : null}
            myProfile={myProfile}
            onProfileSaved={p => { setMyProfile(p); }}
          />
        )}
      </main>

      {tab === 'feed' && (
        <button className="fab" onClick={() => setShowNewPost(true)} aria-label="Новая публикация">
          <IconPlus size={22} />
        </button>
      )}

      {showNewPost && (
        <NewPost
          myId={session.user.id}
          onClose={() => setShowNewPost(false)}
          onPosted={() => { setShowNewPost(false); setFeedKey(k => k + 1) }}
        />
      )}

      <nav className="bottom-nav">
        {[
          { id: 'feed',        label: 'Лента',   Icon: IconFeed },
          { id: 'search',      label: 'Поиск',   Icon: IconSearch },
          { id: 'communities', label: 'Группы',  Icon: IconGroups },
          { id: 'profile',     label: 'Профиль', Icon: IconProfile, selfOnly: true },
        ].map(({ id, label, Icon, selfOnly }) => (
          <button
            key={id}
            className={`bnav ${tab===id && (selfOnly ? !viewProfileId : true) ? 'active' : ''}`}
            onClick={() => goTab(id)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
