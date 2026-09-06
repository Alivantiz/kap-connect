import { useState } from 'react'
import { dzoCore, timeAgo } from '../lib/format'
import { IconHeart, IconComment, IconCheckCircle, IconTrash } from './Icons'
import { postType } from '../lib/postTypes'
import Avatar from './ui/Avatar'

const LONG = 420

export default function PostCard({
  post,
  liked,
  onToggleLike,
  onOpenComments,
  onOpenProfile,
  onDelete,
  myId,
}) {
  // Длинный кейс раньше обрезался на пятой строке и прочитать его было негде:
  // экрана поста в приложении нет, а в окне ответов текст резался ещё сильнее.
  const [expanded, setExpanded] = useState(false)
  const t = postType(post.type)
  const { Icon } = t
  const likes = Number(post.likes_count) || 0
  const comments = Number(post.comments_count) || 0
  const meta = [dzoCore(post.author_dzo, 2), post.author_position || post.author_specialty]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="post">
      <div className="post-head">
        <Avatar
          name={post.author_name}
          size={42}
          expert={post.author_is_expert}
          onClick={() => onOpenProfile(post.author_id)}
        />
        <div className="post-who">
          <div className="post-who-top">
            <button
              type="button"
              className="post-name"
              onClick={() => onOpenProfile(post.author_id)}
            >
              {post.author_name}
            </button>
            <time className="post-time" dateTime={post.created_at}>
              {timeAgo(post.created_at)}
            </time>
          </div>
          {meta && <div className="post-meta">{meta}</div>}
        </div>
        {post.author_id === myId && onDelete && (
          <button
            type="button"
            className="icon-btn icon-btn-sm post-del"
            onClick={() => onDelete(post)}
            aria-label="Удалить публикацию"
          >
            <IconTrash size={16} />
          </button>
        )}
      </div>

      <div className="post-body">
        <div className="post-tagline">
          <span className={`type-badge ${t.cls}`}>
            <Icon size={12} />
            {t.label}
          </span>
          {post.type === 'question' && post.is_solved && (
            <span className="type-badge type-solved">
              <IconCheckCircle size={12} />
              Решён
            </span>
          )}
        </div>

        <h3 className="post-title">{post.title}</h3>
        {post.body && (
          <>
            <p className={`post-text ${expanded ? '' : 'post-text-clamp'}`}>{post.body}</p>
            {post.body.length > LONG && (
              <button
                type="button"
                className="link link-more"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? 'Свернуть' : 'Показать полностью'}
              </button>
            )}
          </>
        )}

        {post.tags?.length > 0 && (
          <div className="chips">
            {post.tags.slice(0, 6).map((tag) => (
              <span className="chip" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="post-foot">
        <button
          type="button"
          className={`act ${liked ? 'act-liked' : ''}`}
          onClick={() => onToggleLike(post)}
          aria-pressed={liked}
          aria-label={liked ? 'Убрать отметку «полезно»' : 'Отметить как полезное'}
        >
          <IconHeart size={17} active={liked} />
          {likes > 0 && <span>{likes}</span>}
        </button>
        <button type="button" className="act" onClick={() => onOpenComments(post)}>
          <IconComment size={17} />
          <span>{comments > 0 ? comments : 'Ответить'}</span>
        </button>
      </div>
    </article>
  )
}
