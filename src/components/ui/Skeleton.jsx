/**
 * Скелетоны вместо крутящегося спиннера: экран не «прыгает» при загрузке,
 * потому что заглушка занимает столько же места, сколько будущий контент.
 */
export const SkeletonLine = ({ w = '100%', h = 12 }) => (
  <span className="sk" style={{ width: w, height: h }} />
)

export function PostSkeleton() {
  return (
    <article className="post" aria-hidden="true">
      <div className="post-head">
        <span className="sk sk-circle" style={{ width: 42, height: 42 }} />
        <div style={{ flex: 1 }}>
          <SkeletonLine w="45%" h={13} />
          <div style={{ height: 7 }} />
          <SkeletonLine w="62%" h={10} />
        </div>
      </div>
      <div className="post-body">
        <SkeletonLine w="30%" h={18} />
        <div style={{ height: 10 }} />
        <SkeletonLine w="88%" h={15} />
        <div style={{ height: 8 }} />
        <SkeletonLine w="96%" h={11} />
        <div style={{ height: 6 }} />
        <SkeletonLine w="70%" h={11} />
      </div>
    </article>
  )
}

export function RowSkeleton({ count = 5 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="sk-row" key={i}>
          <span className="sk sk-circle" style={{ width: 44, height: 44 }} />
          <div style={{ flex: 1 }}>
            <SkeletonLine w={`${40 + ((i * 13) % 30)}%`} h={13} />
            <div style={{ height: 7 }} />
            <SkeletonLine w={`${55 + ((i * 17) % 25)}%`} h={10} />
          </div>
        </div>
      ))}
    </div>
  )
}

export const FeedSkeleton = ({ count = 3 }) => (
  <div aria-hidden="true">
    {Array.from({ length: count }, (_, i) => (
      <PostSkeleton key={i} />
    ))}
  </div>
)
