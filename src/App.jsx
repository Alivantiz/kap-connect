import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Logo, IconFeed, IconSearch, IconGroups, IconProfile, IconPlus } from './components/Icons'
import Auth from './screens/Auth'
import Feed from './screens/Feed'
import Search from './screens/Search'
import Communities from './screens/Communities'
import Profile from './screens/Profile'
import NewPost from './components/NewPost'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [myProfile, setMyProfile] = useState(null)
  const [tab, setTab] = useState('feed')
  const [viewProfileId, setViewProfileId] = useState(null) // чужой профиль
  const [showNewPost, setShowNewPost] = useState(false)
  const [feedKey, setFeedKey] = useState(0) // для перезагрузки ленты

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setMyProfile(null); return }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setMyProfile(data))
  }, [session])

  if (session === undefined) return <div className="spinner" />
  if (!session) return <Auth />

  const openProfile = (id) => {
    setViewProfileId(id)
    setTab('profile')
  }

  const goTab = (t) => {
    setViewProfileId(null)
    setTab(t)
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-logo">
          <Logo size={26} />
          KAP<span className="dot">.</span>Connect
        </div>
      </div>

      <div className="content">
        {tab === 'feed' && (
          <Feed key={feedKey} myId={session.user.id} onOpenProfile={openProfile} />
        )}
        {tab === 'search' && (
          <Search onOpenProfile={openProfile} />
        )}
        {tab === 'communities' && (
          <Communities myId={session.user.id} />
        )}
        {tab === 'profile' && (
          <Profile
            profileId={viewProfileId || session.user.id}
            isMe={!viewProfileId || viewProfileId === session.user.id}
            onBack={viewProfileId ? () => { setViewProfileId(null); setTab('feed') } : null}
            myProfile={myProfile}
            onProfileSaved={setMyProfile}
          />
        )}
      </div>

      {(tab === 'feed') && (
        <button className="fab" onClick={() => setShowNewPost(true)}>
          <IconPlus size={24} />
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
        <button className={`bnav ${tab==='feed'?'active':''}`} onClick={() => goTab('feed')}>
          <IconFeed size={22} />
          <span>Лента</span>
        </button>
        <button className={`bnav ${tab==='search'?'active':''}`} onClick={() => goTab('search')}>
          <IconSearch size={22} />
          <span>Поиск</span>
        </button>
        <button className={`bnav ${tab==='communities'?'active':''}`} onClick={() => goTab('communities')}>
          <IconGroups size={22} />
          <span>Группы</span>
        </button>
        <button className={`bnav ${tab==='profile'&&!viewProfileId?'active':''}`} onClick={() => goTab('profile')}>
          <IconProfile size={22} />
          <span>Профиль</span>
        </button>
      </nav>
    </div>
  )
}
