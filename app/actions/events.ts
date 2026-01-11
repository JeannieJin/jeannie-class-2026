'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { getCurrentUser } from './auth'

type Event = Database['public']['Tables']['events']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']
type EventUpdate = Database['public']['Tables']['events']['Update']

/**
 * 특정 월의 모든 일정 가져오기
 */
export async function getEventsByMonth(year: number, month: number) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { data: [], error: '로그인이 필요합니다.' }
  }

  // 해당 월의 첫날과 마지막날 계산
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('일정 조회 오류:', error)
    return { data: [], error: error.message }
  }

  return { data: data as Event[], error: null }
}

/**
 * 특정 날짜의 일정 가져오기
 */
export async function getEventsByDate(date: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { data: [], error: '로그인이 필요합니다.' }
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_date', date)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('일정 조회 오류:', error)
    return { data: [], error: error.message }
  }

  return { data: data as Event[], error: null }
}

/**
 * 이번주 일정 가져오기
 */
export async function getThisWeekEvents() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { data: [], error: '로그인이 필요합니다.' }
  }

  // 오늘 날짜 기준으로 이번주 일요일~토요일 계산
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 (일요일) ~ 6 (토요일)

  // 이번주 일요일
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)

  // 이번주 토요일
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const startDate = startOfWeek.toISOString().split('T')[0]
  const endDate = endOfWeek.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('이번주 일정 조회 오류:', error)
    return { data: [], error: error.message }
  }

  return { data: data as Event[], error: null }
}

/**
 * 일정 생성
 */
export async function createEvent(eventData: Omit<EventInsert, 'created_by'>) {
  const supabase = await createClient()

  // 현재 사용자 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: '로그인이 필요합니다.' }
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      created_by: user.id,
    } as never)
    .select()
    .single()

  if (error) {
    console.error('일정 생성 오류:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard')
  return { data: data as Event, error: null }
}

/**
 * 일정 수정
 */
export async function updateEvent(id: string, eventData: EventUpdate) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { data: null, error: '로그인이 필요합니다.' }
  }

  // 소유권 검증: 본인이 만든 일정만 수정 가능
  const { data: existingEvent, error: fetchError } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', id)
    .single<{ created_by: string }>()

  if (fetchError || !existingEvent) {
    console.error('일정 조회 오류:', fetchError)
    return { data: null, error: '일정을 찾을 수 없습니다.' }
  }

  if (existingEvent.created_by !== user.id) {
    return { data: null, error: '본인이 만든 일정만 수정할 수 있습니다.' }
  }

  const { data, error } = await supabase
    .from('events')
    .update(eventData as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('일정 수정 오류:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard')
  return { data: data as Event, error: null }
}

/**
 * 일정 삭제
 */
export async function deleteEvent(id: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  // 소유권 검증: 본인이 만든 일정만 삭제 가능
  const { data: existingEvent, error: fetchError } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', id)
    .single<{ created_by: string }>()

  if (fetchError || !existingEvent) {
    console.error('일정 조회 오류:', fetchError)
    return { error: '일정을 찾을 수 없습니다.' }
  }

  if (existingEvent.created_by !== user.id) {
    return { error: '본인이 만든 일정만 삭제할 수 있습니다.' }
  }

  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) {
    console.error('일정 삭제 오류:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard')
  return { error: null }
}

/**
 * 일정 완료 상태 토글
 */
export async function toggleEventComplete(id: string, isCompleted: boolean) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { data: null, error: '로그인이 필요합니다.' }
  }

  const { data, error } = await supabase
    .from('events')
    .update({ is_completed: isCompleted } as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('일정 완료 상태 변경 오류:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard')
  return { data: data as Event, error: null }
}
