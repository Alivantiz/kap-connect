import { Component } from 'react'
import { IconAlert, IconRefresh } from './Icons'

/**
 * Раньше любая ошибка рендера давала белый экран без единого следа.
 * Теперь пользователь видит понятное сообщение и кнопку перезагрузки.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[KAP Connect]', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="crash">
        <div className="crash-icon">
          <IconAlert size={34} />
        </div>
        <div className="crash-title">Что-то пошло не так</div>
        <div className="crash-text">
          Приложение столкнулось с ошибкой. Обновите страницу — данные не потеряются.
        </div>
        <button
          type="button"
          className="btn btn-primary btn-md"
          onClick={() => window.location.reload()}
        >
          <IconRefresh size={17} />
          <span>Обновить</span>
        </button>
        {import.meta.env.DEV && (
          <pre className="crash-detail">{String(this.state.error?.stack || this.state.error)}</pre>
        )}
      </div>
    )
  }
}
