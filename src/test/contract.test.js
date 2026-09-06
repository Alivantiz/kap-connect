import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Контракт между клиентом и базой.
 *
 * Остальные тесты подменяют весь слой db.js, поэтому имена RPC, их параметры
 * и строки вложенных выборок в них не проверяются вообще: переименуй параметр
 * в SQL — тесты останутся зелёными, а приложение получит PGRST202.
 * Здесь строки запросов ловятся из настоящего кода и сверяются со схемой.
 */

// import.meta.url в среде jsdom не даёт file:-адрес, поэтому путь от корня
const schema = readFileSync(resolve(process.cwd(), 'supabase/schema.sql'), 'utf8')

const calls = { rpc: [], select: [], from: [] }

const builder = () => {
  const b = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'then') return undefined
        return (...args) => {
          if (prop === 'select') calls.select.push(args[0])
          return b
        }
      },
    },
  )
  return b
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (t) => {
      calls.from.push(t)
      return builder()
    },
    rpc: (name, params) => {
      calls.rpc.push([name, params])
      return Promise.resolve({ data: null, error: null })
    },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  },
}))

let db
beforeEach(async () => {
  calls.rpc = []
  calls.select = []
  calls.from = []
  db = await import('../lib/db')
})

describe('RPC: имена и параметры совпадают со схемой', () => {
  const cases = [
    ['search_profiles', () => db.searchProfiles('насос', 'АО «Орталык»')],
    ['mark_solution', () => db.markSolution('c-1')],
    ['get_or_create_conversation', () => db.openConversation('u-2')],
    ['unread_message_count', () => db.unreadMessageCount()],
  ]

  it.each(cases)('%s', async (name, call) => {
    await call()
    const [calledName, params] = calls.rpc.at(-1)
    expect(calledName).toBe(name)

    const sig = schema.match(
      new RegExp(`create or replace function public\\.${name}\\(([^)]*)\\)`, 's'),
    )
    expect(sig, `функции ${name} нет в schema.sql`).not.toBeNull()

    const declared = [...sig[1].matchAll(/(\w+)\s+(?:text|uuid|int|boolean)/g)].map((m) => m[1])
    for (const key of Object.keys(params || {})) {
      expect(declared, `параметр ${key} не объявлен в ${name}`).toContain(key)
    }
  })
})

describe('вложенные выборки ссылаются на существующие внешние ключи', () => {
  it('имена ключей есть в схеме', async () => {
    await db.listComments('p-1')
    await db.listConversations('me-1')
    await db.listNotifications('me-1')

    const hints = [...new Set(calls.select.join(' ').match(/!(\w+_fkey)/g) || [])].map((h) =>
      h.slice(1),
    )
    expect(hints.length).toBeGreaterThan(0)

    for (const hint of hints) {
      const [, table, column] = hint.match(/^(\w+?)_(\w+)_fkey$/)
      // Postgres называет внешний ключ <таблица>_<колонка>_fkey
      const body = schema.match(
        new RegExp(`create table if not exists public\\.${table} \\((.*?)\\n\\);`, 's'),
      )
      expect(body, `таблицы ${table} нет в схеме`).not.toBeNull()
      expect(
        new RegExp(`^\\s*${column}\\s+uuid[^\\n]*references`, 'm').test(body[1]),
        `в ${table} нет колонки ${column} с внешним ключом`,
      ).toBe(true)
    }
  })

  it('все таблицы и представления объявлены в схеме', async () => {
    await Promise.all([
      db.listDzo(),
      db.getProfile('x'),
      db.getProfileStats('x'),
      db.listFeed({ filter: 'all', me: null }),
      db.listCommunities('all'),
      db.listMessages('c'),
      db.listNotifications('me'),
    ])
    const declared = new Set([
      ...[...schema.matchAll(/create table if not exists public\.(\w+)/g)].map((m) => m[1]),
      ...[...schema.matchAll(/create view public\.(\w+)/g)].map((m) => m[1]),
    ])
    for (const t of new Set(calls.from)) {
      expect(declared, `таблицы или представления ${t} нет в схеме`).toContain(t)
    }
  })
})

describe('схема пригодна к обновлению существующей базы', () => {
  it('колонки, добавленные после пилота, доводятся через alter table', () => {
    // create table if not exists не трогает уже созданную таблицу, поэтому
    // без явного alter триггер updated_at и mark_solution падали на боевой базе.
    expect(schema).toMatch(/alter table public\.profiles add column if not exists updated_at/)
    expect(schema).toMatch(/alter table public\.posts\s+add column if not exists is_solved/)
  })

  it('представления объявлены с security_invoker', () => {
    const views = [...schema.matchAll(/create view public\.(\w+)([^;]*?)as\s/gs)]
    expect(views.length).toBe(3)
    for (const [, name, head] of views) {
      expect(head, `${name} обходит RLS без security_invoker`).toMatch(
        /security_invoker\s*=\s*true/,
      )
    }
  })

  it('статус эксперта не выдаётся ни обновлением, ни вставкой', () => {
    const grants = [
      ...schema.matchAll(/grant\s+(?:update|insert)\s*\(([^)]*)\)\s*\n?\s*on public\.profiles/gs),
    ]
    expect(grants.length).toBe(2)
    for (const [, cols] of grants) expect(cols).not.toMatch(/is_expert/)
    expect(schema).toMatch(/revoke update on public\.profiles from authenticated/)
    expect(schema).toMatch(/revoke insert on public\.profiles from authenticated/)
  })

  it('признак решения ставится только функцией, а не прямым обновлением', () => {
    expect(schema).toMatch(/revoke update on public\.comments from authenticated/)
    expect(schema).toMatch(/grant\s+update \(body\) on public\.comments to authenticated/)
  })
})
