import { describe, expect, it, vi } from 'vitest'
import { humanError } from '../lib/db'

describe('humanError', () => {
  it('переводит типовые ответы Supabase', () => {
    expect(humanError({ message: 'Invalid login credentials' })).toBe('Неверный email или пароль')
    expect(humanError({ message: 'User already registered' })).toBe(
      'Этот email уже зарегистрирован',
    )
    expect(humanError({ message: 'Email not confirmed' })).toMatch(/подтверждён/)
  })

  it('объясняет коды Postgres', () => {
    expect(humanError({ code: '23505', message: 'duplicate key' })).toBe(
      'Такая запись уже существует',
    )
    expect(humanError({ code: '23514', message: 'check constraint' })).toBe(
      'Данные не прошли проверку',
    )
    expect(humanError({ code: '42501', message: 'permission denied' })).toBe(
      'Недостаточно прав для этого действия',
    )
  })

  it('распознаёт отказ политики RLS без кода', () => {
    // Отклонение политикой приходит текстом и раньше показывалось
    // пользователю как английская строка из Postgres.
    expect(humanError({ message: 'new row violates row-level security policy' })).toBe(
      'Недостаточно прав для этого действия',
    )
  })

  it('отличает обрыв связи от ошибки сервера', () => {
    expect(humanError({ message: 'Failed to fetch' })).toBe(
      'Нет связи с сервером. Проверьте интернет.',
    )
  })

  it('возвращает null, когда ошибки нет', () => {
    expect(humanError(null)).toBeNull()
    expect(humanError(undefined)).toBeNull()
  })

  it('не теряет незнакомое сообщение', () => {
    expect(humanError({ message: 'что-то своё' })).toBe('что-то своё')
  })
})

describe('слой данных', () => {
  it('поиск уходит в RPC с параметрами, а не в склеенный фильтр', async () => {
    // Ключевая защита: должность вида «Слесарь КИПиА, 5 разряд» раньше
    // ломала весь запрос, потому что значение попадало в строку .or().
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null })
    vi.doMock('../lib/supabase', () => ({ supabase: { rpc } }))
    vi.resetModules()
    const { searchProfiles } = await import('../lib/db')

    await searchProfiles('Слесарь КИПиА, 5 разряд', 'АО «Орталык»')

    expect(rpc).toHaveBeenCalledWith('search_profiles', {
      q: 'Слесарь КИПиА, 5 разряд',
      dzo_filter: 'АО «Орталык»',
    })
    vi.doUnmock('../lib/supabase')
    vi.resetModules()
  })

  it('удаление, не затронувшее ни одной строки, считается неудачей', async () => {
    // PostgREST отвечает 204 без ошибки, когда политика RLS отсеяла все
    // строки. Прежде это выглядело как успех: карточка исчезала из списка,
    // оставаясь в базе.
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    vi.doMock('../lib/supabase', () => ({ supabase: { from: () => builder } }))
    vi.resetModules()
    const { deletePost } = await import('../lib/db')

    const { data, error } = await deletePost('p-1')

    expect(data).toBeNull()
    expect(error).toBe('Недостаточно прав для этого действия')
    vi.doUnmock('../lib/supabase')
    vi.resetModules()
  })

  it('удаление, затронувшее строку, считается успешным', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: 'p-1' }], error: null }),
    }
    vi.doMock('../lib/supabase', () => ({ supabase: { from: () => builder } }))
    vi.resetModules()
    const { deletePost } = await import('../lib/db')

    const { error } = await deletePost('p-1')

    expect(error).toBeNull()
    vi.doUnmock('../lib/supabase')
    vi.resetModules()
  })

  it('подписка на диалоги фильтруется по своим строкам', async () => {
    // Прежняя версия слушала таблицу целиком, и чужая переписка дёргала
    // перезагрузку у каждого пользователя.
    const on = vi.fn().mockReturnThis()
    const channel = vi.fn(() => ({ on, subscribe: vi.fn().mockReturnThis() }))
    vi.doMock('../lib/supabase', () => ({ supabase: { channel, removeChannel: vi.fn() } }))
    vi.resetModules()
    const { subscribeToMyConversations } = await import('../lib/db')

    subscribeToMyConversations('me-1', () => {})

    const filters = on.mock.calls.map(([, opts]) => opts.filter)
    expect(filters).toEqual(['user1_id=eq.me-1', 'user2_id=eq.me-1'])
    vi.doUnmock('../lib/supabase')
    vi.resetModules()
  })

  it('экранирует подстановочные знаки в поиске по имени', async () => {
    // Иначе «%» в запросе совпадает со всеми записями подряд.
    const builder = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    vi.doMock('../lib/supabase', () => ({ supabase: { from: () => builder } }))
    vi.resetModules()
    const { searchPeopleByName } = await import('../lib/db')

    await searchPeopleByName('50%_скидка', 'me-1')

    expect(builder.ilike).toHaveBeenCalledWith('full_name', '%50\\%\\_скидка%')
    vi.doUnmock('../lib/supabase')
    vi.resetModules()
  })
})
