/** Пустое состояние. Иконка — SVG из набора, а не эмодзи. */
export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty-icon" aria-hidden="true">
          <Icon size={30} />
        </div>
      )}
      {title && <div className="empty-title">{title}</div>}
      {text && <div className="empty-text">{text}</div>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}
