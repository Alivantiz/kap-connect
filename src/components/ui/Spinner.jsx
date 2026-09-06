export default function Spinner({ size = 26, inline = false, label = 'Загрузка' }) {
  return (
    <span
      className={inline ? 'spinner spinner-inline' : 'spinner'}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  )
}
