import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Без ключей приложение раньше падало где-то внутри первого запроса
// с невнятной ошибкой. Явное сообщение экономит час на настройке.
if (!url || !key) {
  throw new Error(
    'Не заданы VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY. ' +
      'Скопируйте .env.example в .env и впишите ключи из Supabase → Settings → API.',
  )
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 5 } },
})
