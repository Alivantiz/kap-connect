import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Тесты не должны обращаться к настоящему Supabase: клиент подменяется
// на уровне модуля, а компоненты работают через слой db.js.
vi.mock('../lib/supabase', () => ({ supabase: {} }))

afterEach(() => cleanup())

// jsdom не реализует эти API, а компоненты на них опираются.
window.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}
