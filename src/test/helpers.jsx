import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '../components/ui/Toast'

/**
 * Рендер с провайдером уведомлений — его требуют почти все экраны.
 * Провайдер передаётся через опцию wrapper, а не оборачиванием вручную:
 * иначе rerender подменяет всё дерево и компонент перемонтируется,
 * что делает проверки на повторные запросы бессмысленными.
 */
export function renderApp(ui, options = {}) {
  const user = userEvent.setup()
  const result = render(ui, { wrapper: ToastProvider, ...options })
  return { user, ...result }
}

export const ok = (data) => Promise.resolve({ data, error: null })
export const fail = (message) => Promise.resolve({ data: null, error: message })

export const profileFixture = (over = {}) => ({
  id: 'me-1',
  full_name: 'Ахметов Ерлан Серикович',
  position: 'Слесарь КИПиА',
  specialty: 'Слесарь КИПиА',
  dzo: 'АО «Орталык»',
  region: 'Рудник Орталык',
  experience_years: 7,
  bio: '',
  skills: ['TIA Portal', 'Profibus'],
  equipment: ['Siemens S7-300'],
  telegram: null,
  is_expert: false,
  ...over,
})

export const postFixture = (over = {}) => ({
  id: 'p-1',
  author_id: 'other-1',
  author_name: 'Бекова Айгуль',
  author_position: 'Технолог',
  author_dzo: 'АО «СП «Инкай»',
  author_specialty: 'Технолог',
  author_is_expert: false,
  type: 'case',
  title: 'Замена уплотнения насоса ГрАТ',
  body: 'Течь по валу. Заменили торцевое уплотнение, помогло.',
  tags: ['насосы'],
  is_solved: false,
  likes_count: 3,
  comments_count: 1,
  created_at: new Date().toISOString(),
  ...over,
})
