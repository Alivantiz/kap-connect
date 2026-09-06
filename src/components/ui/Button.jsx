import Spinner from './Spinner'

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  children,
  className = '',
  disabled,
  ...rest
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner size={16} inline />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 15 : 17} />
      ) : null}
      {children && <span>{children}</span>}
    </button>
  )
}
