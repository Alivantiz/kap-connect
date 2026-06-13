import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Logo, IconFeed, IconProfile, IconPlus, IconSearch, IconComment, IconBell } from './components/Icons'
import Auth from './screens/Auth'
import Feed from './screens/Feed'
import Messages from './screens/Messages'
import Activity from './screens/Activity'
import Profile from './screens/Profile'
import Search from './screens/Search'
import NewPost from './components/NewPost'

const AVA_COLORS = ['#3A6BA8','#2E7D52','#8B5E1A','#5B3EA6','#7A3030','#1A6B6B','#4A6B1A','#6B1A5B']
const avaColor = (name) => AVA_COLORS[(name?.charCodeAt(0)||0) % AVA_COLORS.length]
const initials = (name) => (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()

export default function App() {
  const [session, setSession]         = useState(undefined)
  const [myProfile, setMyProfile]     = useState(null)
  const [tab, setTab]                 = useState('feed')
  const [viewProfileId, setViewProfileId] = useState(null)
  const [showNewPost, setShowNewPost] = useState(false)
  const [showSearch, setShowSearch]   = useState(false)
  const [feedKey, setFeedKey]         = useState(0)
  const [unreadMsgs, setUnreadMsgs]   = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setMyProfile(null); return }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setMyProfile(data))
  }, [session])

  // Счётчики непрочитанных
  useEffect(() => {
    if (!session?.user) return
    const uid = session.user.id

    const loadCounts = async () => {
      const { count: msgs } = await supabase
        .from('messages').select('id', { count:'exact', head:true })
        .eq('read', false).neq('sender_id', uid)
      const { count: notifs } = await supabase
        .from('notifications').select('id', { count:'exact', head:true })
        .eq('user_id', uid).eq('read', false)
      setUnreadMsgs(msgs || 0)
      setUnreadNotifs(notifs || 0)
    }

    loadCounts()
    const interval = setInterval(loadCounts, 30000)
    return () => clearInterval(interval)
  }, [session])

  if (session === undefined) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div className="spinner" />
    </div>
  )
  if (!session) return <Auth />

  const openProfile = (id) => { setViewProfileId(id); setTab('profile') }
  const goTab = (t) => { setViewProfileId(null); setTab(t) }

  return (
    <div className="app">
      {/* Топбар */}
      <header className="topbar">
        <div className="topbar-logo">
          <Logo size={24} />
          KAP<span className="dot">.</span>Connect
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button className="icon-btn" onClick={() => setShowSearch(true)}>
            <IconSearch size={19} />
          </button>
          {myProfile && (
            <div className="ava topbar-ava"
              style={{ background: avaColor(myProfile.full_name) }}
              onClick={() => goTab('profile')}>
              {initials(myProfile.full_name)}
            </div>
          )}
        </div>
      </header>

      {/* Контент */}
      <main className="content">
        {tab === 'feed' && (
          <Feed key={feedKey} myId={session.user.id} onOpenProfile={openProfile} />
        )}
        {tab === 'messages' && (
          <Messages myId={session.user.id} myProfile={myProfile}
            onOpenProfile={openProfile}
            onUnreadChange={setUnreadMsgs} />
        )}
        {tab === 'activity' && (
          <Activity myId={session.user.id} onOpenProfile={openProfile}
            onRead={() => setUnreadNotifs(0)} />
        )}
        {tab === 'profile' && (
          <Profile
            profileId={viewProfileId || session.user.id}
            isMe={!viewProfileId || viewProfileId === session.user.id}
            onBack={viewProfileId ? () => { setViewProfileId(null); setTab('feed') } : null}
            myProfile={myProfile}
            onProfileSaved={setMyProfile}
            onMessage={(id) => { setViewProfileId(null); setTab('messages') }}
          />
        )}
      </main>

      {/* FAB — только на ленте */}
      {tab === 'feed' && (
        <button className="fab" onClick={() => setShowNewPost(true)}>
          <IconPlus size={22} />
        </button>
      )}

      {/* Поиск — слайд поверх */}
      {showSearch && (
        <div className="search-overlay">
          <Search myId={session.user.id} onOpenProfile={(id) => { setShowSearch(false); openProfile(id) }}
            onClose={() => setShowSearch(false)} />
        </div>
      )}

      {showNewPost && (
        <NewPost myId={session.user.id}
          onClose={() => setShowNewPost(false)}
          onPosted={() => { setShowNewPost(false); setFeedKey(k => k+1) }} />
      )}

      {/* Нижняя навигация — 4 вкладки */}
      <nav className="bottom-nav">
        <button className={`bnav ${tab==='feed'?'active':''}`} onClick={() => goTab('feed')}>
          <IconFeed size={22} />
          <span>Лента</span>
        </button>

        <button className={`bnav ${tab==='messages'?'active':''}`} onClick={() => goTab('messages')}
          style={{ position:'relative' }}>
          <IconComment size={22} />
          {unreadMsgs > 0 && <div className="bnav-badge">{unreadMsgs > 9 ? '9+' : unreadMsgs}</div>}
          <span>Сообщения</span>
        </button>

        <button className={`bnav ${tab==='activity'?'active':''}`} onClick={() => goTab('activity')}
          style={{ position:'relative' }}>
          <IconBell size={22} />
          {unreadNotifs > 0 && <div className="bnav-badge">{unreadNotifs > 9 ? '9+' : unreadNotifs}</div>}
          <span>Активность</span>
        </button>

        <button className={`bnav ${tab==='profile'&&!viewProfileId?'active':''}`} onClick={() => goTab('profile')}>
          <IconProfile size={22} />
          <span>Профиль</span>
        </button>
      </nav>
    </div>
  )
}
