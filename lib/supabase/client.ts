import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트
 * - 브라우저에서만 실행됨
 * - 'use client' 컴포넌트에서 사용
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
