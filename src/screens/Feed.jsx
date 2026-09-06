import { useCallback, useEffect, useRef, useState } from 'react'
import { deletePost, likePost, listFeed, myLikedPostIds, unlikePost } from '../lib/db'
import { dzoCore, specShort } from '../lib/format'
import { IconEmptyFeed, IconAlert, IconRefresh } from '../components/Icons'
import PostCard from '../components/PostCard'
import CommentsSheet from '../components/CommentsSheet'
import EmptyState from '../components/ui/EmptyState'
import { FeedSkeleton } from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/toast-context'

const PAGE = 30

export default function Feed({ myId, myProfile, onOpenProfile, onNeedProfile }) {
  const [filter, setFilter] = useState('all')
  const [posts, setPosts] = useState(null)
  const [likes, setLikes] = useState(() => new Set())
  const [error, setError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [done, setDone] = useState(false)
  const [openPost, setOpenPost] = useState(null)
  const toast = useToast()

  // Лайки нельзя отправлять параллельно по одному посту: быстрый двойной тап
  // раньше давал гонку INSERT/DELETE и счётчик расходился с базой навсегда.
  const inFlight = useRef(new Set())
  // Ответ устаревшего запроса не должен затирать свежий список.
  const reqId = useRef(0)

  const dzoLabel = dzoCore(myProfile?.dzo, 2) || 'Моё ДЗО'
  const specLabel = specShort(myProfile?.position, myProfile?.specialty)
  const hasDzo = !!myProfile?.dzo
  const hasSpec = !!(myProfile?.specialty || myProfile?.position)

  const TABS = [
    { key: 'all', label: 'Все КАП', enabled: true },
    { key: 'dzo', label: dzoLabel, enabled: hasDzo, title: myProfile?.dzo },
    {
      key: 'specialty',
      label: specLabel,
      enabled: hasSpec,
      title: myProfile?.specialty || myProfile?.position,
    },
    { key: 'questions', label: 'Вопросы', enabled: true },
  ]

  const load = useCallback(async () => {
    const id = ++reqId.current
    setError('')
    setDone(false)
    const [feed, liked] = await Promise.all([
      listFeed({ filter, me: myProfile, limit: PAGE }),
      myLikedPostIds(myId),
    ])
    if (id !== reqId.current) return
    if (feed.error) {
      setPosts([])
      setError(feed.error)
      return
    }
    setPosts(feed.data)
    setDone((feed.data || []).length < PAGE)
    if (liked.data) setLikes(liked.data)
  }, [filter, myProfile, myId])

  useEffect(() => {
    load()
  }, [load])

  const loadMore = async () => {
    if (loadingMore || done || !posts?.length) return
    setLoadingMore(true)
    const last = posts[posts.length - 1]
    const { data, error: e } = await listFeed({
      filter,
      me: myProfile,
      limit: PAGE,
      before: last.created_at,
    })
    setLoadingMore(false)
    if (e) return toast.error(e)
    const fresh = (data || []).filter((p) => !posts.some((x) => x.id === p.id))
    if (fresh.length < PAGE) setDone(true)
    setPosts((prev) => [...prev, ...fresh])
  }

  /**
   * Лайк с откатом. Раньше результат запроса выбрасывался: при сбое сети
   * или отказе RLS сердечко оставалось закрашенным, и пользователь считал,
   * что отметка сохранилась.
   */
  const toggleLike = async (post) => {
    if (inFlight.current.has(post.id)) return
    inFlight.current.add(post.id)

    const wasLiked = likes.has(post.id)
    const delta = wasLiked ? -1 : 1

    setLikes((prev) => {
      const next = new Set(prev)
      if (wasLiked) next.delete(post.id)
      else next.add(post.id)
      return next
    })
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, likes_count: Math.max(0, Number(p.likes_count) + delta) } : p,
      ),
    )

    const { error: e } = wasLiked ? await unlikePost(post.id, myId) : await likePost(post.id, myId)
    inFlight.current.delete(post.id)
    if (!e) return

    setLikes((prev) => {
      const next = new Set(prev)
      if (wasLiked) next.add(post.id)
      else next.delete(post.id)
      return next
    })
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, likes_count: Math.max(0, Number(p.likes_count) - delta) } : p,
      ),
    )
    toast.error(e)
  }

  const remove = async (post) => {
    if (!window.confirm(`Удалить публикацию «${post.title}»?`)) return
    const { error: e } = await deletePost(post.id)
    if (e) return toast.error(e)
    setPosts((prev) => prev.filter((p) => p.id !== post.id))
    toast.success('Публикация удалена')
  }

  /** Счётчик ответов обновляется точечно — раньше закрытие окна перезагружало всю ленту. */
  const refreshCounts = useCallback(async () => {
    const { data } = await listFeed({ filter, me: myProfile, limit: PAGE })
    if (!data) return
    const byId = new Map(data.map((p) => [p.id, p]))
    setPosts((prev) => prev.map((p) => byId.get(p.id) || p))
  }, [filter, myProfile])

  return (
    <>
      <div className="segmented" role="tablist" aria-label="Фильтр ленты">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={filter === t.key}
            title={t.title || undefined}
            className={`seg ${filter === t.key ? 'seg-on' : ''}`}
            onClick={() => (t.enabled ? setFilter(t.key) : onNeedProfile?.())}
            data-disabled={!t.enabled || undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {posts === null && <FeedSkeleton />}

      {error && (
        <EmptyState
          icon={IconAlert}
          title="Не удалось загрузить ленту"
          text={error}
          action={
            <Button variant="ghost" icon={IconRefresh} onClick={load}>
              Повторить
            </Button>
          }
        />
      )}

      {posts?.length === 0 && !error && (
        <EmptyState
          icon={IconEmptyFeed}
          title="Пока пусто"
          text={
            filter === 'dzo'
              ? `В «${dzoLabel}» ещё нет публикаций. Будьте первым — коллеги увидят.`
              : filter === 'specialty'
                ? 'По вашей специальности публикаций пока нет.'
                : filter === 'questions'
                  ? 'Открытых вопросов нет. Задайте свой — ответят коллеги со всех предприятий.'
                  : 'Поделитесь кейсом или задайте вопрос — вас увидят на всех предприятиях группы.'
          }
        />
      )}

      {posts?.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          myId={myId}
          liked={likes.has(p.id)}
          onToggleLike={toggleLike}
          onOpenComments={setOpenPost}
          onOpenProfile={onOpenProfile}
          onDelete={remove}
        />
      ))}

      {posts?.length > 0 && !done && (
        <div className="load-more">
          <Button variant="ghost" loading={loadingMore} onClick={loadMore}>
            Показать ещё
          </Button>
        </div>
      )}

      {posts?.length > 0 && done && <div className="feed-end">Это все публикации</div>}

      {openPost && (
        <CommentsSheet
          post={openPost}
          myId={myId}
          onClose={() => setOpenPost(null)}
          onOpenProfile={onOpenProfile}
          onChanged={refreshCounts}
        />
      )}
    </>
  )
}
