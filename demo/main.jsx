import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from '../src/App.jsx'
import ErrorBoundary from '../src/components/ErrorBoundary.jsx'
import { IconClose } from '../src/components/Icons.jsx'
import '../src/index.css'
import './demo.css'

/**
 * Плашка о том, что это демонстрация. Данные вымышленные и живут только
 * в памяти вкладки: перезагрузка возвращает их в исходное состояние.
 */
function DemoNote() {
  const [shown, setShown] = useState(true)
  if (!shown) return null
  return (
    <div className="demo-note" role="note">
      <span>
        Демонстрация. Сотрудники и публикации вымышленные, изменения живут до перезагрузки страницы.
      </span>
      <button type="button" onClick={() => setShown(false)} aria-label="Скрыть уведомление">
        <IconClose size={15} />
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <DemoNote />
    </ErrorBoundary>
  </React.StrictMode>,
)
