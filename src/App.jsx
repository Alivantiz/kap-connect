import { useCallback, useEffect, useRef, useState } from 'react'
import {
  auth,
  countUnreadNotifications,
  getProfile,
  subscribeToMyNotifications,
  unreadMessageCount,
} from './lib/db'
import {
  Logo,
  IconBell,
  IconFeed,
  IconGroups,
  IconMessages,
  IconPlus,
  IconProfile,
  IconSearch,
} from './components/Icons'
import Auth from './screens/Auth'
import Feed from './screens/Feed'
import Search from './screens/Search'
import Communities from './screens/Communities'
import Messages from './screens/Messages'
import Activity from './screens/Activity'
import Profile from './screens/Profile'
import NewPost from './components/NewPost'
import Avatar from './components/ui/Avatar'
import Spinner from './components/ui/Spinner'
import { ToastProvider } from './components/ui/Toast'
import { useToast } from './components/ui/toast-context'

const TABS = [
  { key: 'feed', label: 'Лента', Icon: IconFeed },
  { key: 'communities', label: 'Группы', Icon: IconGroups },
  { key: 'messages', label: 'Чаты', Icon: IconMessages },
  { key: 'activity', label: 'События', Icon: IconBell },
  { key: 'profile', label: 'Профиль', Icon: IconProfile },
]

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}

function Shell() {
  const [session, setSession] = useState(undefined)
  const [me, setMe] = useState(null)
  const [tab, setTab] = useState('feed')
  const [viewProfile, setViewProfile] = useState(null)
  const [returnTab, setReturnTab] = useState('feed')
  const [composing, setComposing] = useState(false)
  const [searching, setSearching] = useState(false)
  const [chatWith, setChatWith] = useState(null)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const toast = useToast()
  const uid = session?.user?.id

  useEffect(() => {
    let alive = true
    auth.getSession().then(({ data }) => alive && setSession(data?.session ?? null))
    const {
      data: { subscription },
    } = auth.onAuthStateChange((_e, s) => setSession(s))
    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!uid) {
      setMe(null)
      return
    }
    let alive = true
    getProfile(uid).then(({ data, error }) => {
      if (!alive) return
      if (error) toast.error(error)
      setMe(data || null)
    })
    return () => {
      alive = false
    }
  }, [uid, toast])

  const refreshCounts = useCallback(async () => {
    if (!uid) return
    const [m, n] = await Promise.all([unreadMessageCount(), countUnreadNotifications(uid)])
    if (!m.error) setUnreadMsgs(m.data || 0)
    if (!n.error) setUnreadNotifs(n.data || 0)
  }, [uid])

  /**
   * Счётчики. Опрос раз в минуту вместо тридцати секунд и только когда
   * вкладка видима: раньше таймер бил в базу даже у свёрнутого браузера.
   * Основной канал — realtime, опрос лишь подстраховка.
   */
  useEffect(() => {
    if (!uid) return
    refreshCounts()
    const tick = () => document.visibilityState === 'visible' && refreshCounts()
    const timer = setInterval(tick, 60000)
    document.addEventListener('visibilitychange', tick)
    const unsub = subscribeToMyNotifications(uid, refreshCounts)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
      unsub()
    }
  }, [uid, refreshCounts])

  const goTab = useCallback((t) => {
    setViewProfile(null)
    setTab(t)
  }, [])

  /** Открыть чужой профиль, запомнив, откуда пришли. */
  const openProfile = useCallback(
    (id) => {
      if (!id) return
      if (id === uid) {
        setViewProfile(null)
        setTab('profile')
        return
      }
      setReturnTab(tab)
      setViewProfile(id)
      setTab('profile')
    },
    [tab, uid],
  )

  const closeProfile = useCallback(() => {
    setViewProfile(null)
    setTab(returnTab)
  }, [returnTab])

  /**
   * Аппаратная кнопка «назад» на Android закрывала приложение целиком.
   * Теперь она сначала снимает верхний слой: поиск, окно создания,
   * просмотр чужого профиля.
   */
  const layers = [searching, composing, !!viewProfile].filter(Boolean).length
  const prevLayers = useRef(0)
  useEffect(() => {
    if (layers > prevLayers.current) window.history.pushState({ kap: layers }, '')
    prevLayers.current = layers
  }, [layers])

  useEffect(() => {
    const onPop = () => {
      if (searching) return setSearching(false)
      if (composing) return setComposing(false)
      if (viewProfile) return closeProfile()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [searching, composing, viewProfile, closeProfile])

  if (session === undefined) {
    return (
      <div className="boot">
        <Logo size={40} />
        <Spinner size={22} />
      </div>
    )
  }
  if (!session) return <Auth />

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Logo size={24} />
          <span>
            KAP<span className="dot">.</span>Connect
          </span>
        </div>
        <div className="topbar-right">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSearching(true)}
            aria-label="Поиск экспертов"
          >
            <IconSearch size={19} />
          </button>
          {me && (
            <Avatar
              name={me.full_name}
              size={32}
              expert={me.is_expert}
              onClick={() => goTab('profile')}
            />
          )}
        </div>
      </header>

      <main className="content">
        {tab === 'feed' && (
          <Feed
            myId={uid}
            myProfile={me}
            onOpenProfile={openProfile}
            onNeedProfile={() =>
              toast('Укажите предприятие и должность в профиле, чтобы включить этот фильтр')
            }
          />
        )}
        {tab === 'communities' && <Communities myId={uid} />}
        {tab === 'messages' && (
          <Messages
            myId={uid}
            onOpenProfile={openProfile}
            onUnreadChange={refreshCounts}
            startWith={chatWith}
            onStartHandled={() => setChatWith(null)}
          />
        )}
        {tab === 'activity' && (
          <Activity myId={uid} onOpenProfile={openProfile} onRead={refreshCounts} />
        )}
        {tab === 'profile' && (
          <Profile
            profileId={viewProfile || uid}
            isMe={!viewProfile}
            onBack={viewProfile ? closeProfile : null}
            onProfileSaved={setMe}
            onMessage={(person) => {
              setViewProfile(null)
              setChatWith(person)
              setTab('messages')
            }}
          />
        )}
      </main>

      {tab === 'feed' && (
        <button
          type="button"
          className="fab"
          onClick={() => setComposing(true)}
          aria-label="Создать публикацию"
        >
          <IconPlus size={22} />
        </button>
      )}

      {searching && (
        <Search
          onOpenProfile={(id) => {
            setSearching(false)
            openProfile(id)
          }}
          onClose={() => setSearching(false)}
        />
      )}

      {composing && (
        <NewPost
          myId={uid}
          onClose={() => setComposing(false)}
          onPosted={() => {
            setComposing(false)
            goTab('feed')
          }}
        />
      )}

      <nav className="bottombar" aria-label="Основная навигация">
        {TABS.map(({ key, label, Icon }) => {
          const badge = key === 'messages' ? unreadMsgs : key === 'activity' ? unreadNotifs : 0
          const active = tab === key && (key !== 'profile' || !viewProfile)
          return (
            <button
              key={key}
              type="button"
              className={`bnav ${active ? 'bnav-on' : ''}`}
              onClick={() => goTab(key)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="bnav-icon">
                <Icon size={21} />
                {badge > 0 && (
                  <span className="badge" aria-label={`Непрочитанных: ${badge}`}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="bnav-label">{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
