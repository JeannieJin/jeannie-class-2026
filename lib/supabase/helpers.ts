/**
 * Supabase 타입 안전 헬퍼 함수
 * - 'as any' 사용을 방지하고 타입 안정성을 향상시킴
 */

import type { Database } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 테이블 이름 타입
 */
type TableName = keyof Database['public']['Tables']

/**
 * 특정 테이블의 Row 타입
 */
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']

/**
 * 특정 테이블의 Insert 타입
 */
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']

/**
 * 특정 테이블의 Update 타입
 */
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

/**
 * 타입 안전 insert 헬퍼
 */
export async function insertRow<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  data: TableInsert<T>
) {
  return await supabase
    .from(table)
    .insert(data as never)
    .select()
}

/**
 * 타입 안전 insert single 헬퍼
 */
export async function insertRowSingle<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  data: TableInsert<T>
) {
  return await supabase
    .from(table)
    .insert(data as never)
    .select()
    .single()
}

/**
 * 타입 안전 update 헬퍼
 */
export async function updateRow<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  id: string,
  data: TableUpdate<T>
) {
  return await supabase
    .from(table)
    .update(data as never)
    .eq('id' as never, id as never)
    .select()
}

/**
 * 타입 안전 update single 헬퍼
 */
export async function updateRowSingle<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  id: string,
  data: TableUpdate<T>
) {
  return await supabase
    .from(table)
    .update(data as never)
    .eq('id' as never, id as never)
    .select()
    .single()
}

/**
 * 타입 안전 delete 헬퍼
 */
export async function deleteRow<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  id: string
) {
  return await supabase
    .from(table)
    .delete()
    .eq('id' as never, id as never)
}

/**
 * FormData 타입 안전 추출 헬퍼
 */
export const formData = {
  /**
   * string 값 추출 (null 허용 안 함)
   */
  getString(formData: FormData, key: string): string {
    const value = formData.get(key)
    if (typeof value !== 'string' || !value) {
      throw new Error(`필수 필드 '${key}'가 누락되었습니다.`)
    }
    return value
  },

  /**
   * string 값 추출 (null 허용)
   */
  getStringOptional(formData: FormData, key: string): string | null {
    const value = formData.get(key)
    return typeof value === 'string' ? value : null
  },

  /**
   * number 값 추출 (null 허용 안 함)
   */
  getNumber(formData: FormData, key: string): number {
    const value = formData.get(key)
    if (typeof value !== 'string' || !value) {
      throw new Error(`필수 필드 '${key}'가 누락되었습니다.`)
    }
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      throw new Error(`'${key}' 값이 숫자가 아닙니다.`)
    }
    return num
  },

  /**
   * number 값 추출 (null 허용)
   */
  getNumberOptional(formData: FormData, key: string): number | null {
    const value = formData.get(key)
    if (typeof value !== 'string' || !value) {
      return null
    }
    const num = parseInt(value, 10)
    return isNaN(num) ? null : num
  },

  /**
   * boolean 값 추출
   */
  getBoolean(formData: FormData, key: string): boolean {
    const value = formData.get(key)
    return value === 'true' || value === '1' || value === 'on'
  },

  /**
   * Date 값 추출 (ISO string으로 변환)
   */
  getDate(formData: FormData, key: string): string | null {
    const value = formData.get(key)
    if (typeof value !== 'string' || !value) {
      return null
    }
    return value
  },
}
