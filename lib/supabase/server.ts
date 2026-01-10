import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * 서버 컴포넌트/Server Actions용 Supabase 클라이언트
 * - 서버에서만 실행됨
 * - 쿠키를 통해 세션 관리
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll은 Server Component에서 호출될 때 무시됨
            // 미들웨어에서만 쿠키를 설정할 수 있음
          }
        },
      },
    }
  )
}
