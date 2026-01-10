'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'

type AnnouncementInsert = Database['public']['Tables']['announcements']['Insert']
type AnnouncementUpdate = Database['public']['Tables']['announcements']['Update']

// 전달사항 생성
export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  // 교사만 전달사항을 생성할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const priority = formData.get('priority') as string
  const isPinned = formData.get('isPinned') === 'true'

  if (!title || !content) {
    return { error: '제목과 내용은 필수입니다.' }
  }

  const announcementData: AnnouncementInsert = {
    title,
    content,
    priority: priority as 'high' | 'medium' | 'low',
    is_pinned: isPinned,
    created_by: user.id,
  }

  const { data, error } = await (supabase
    .from('announcements') as any)
    .insert(announcementData)
    .select()
    .single()

  if (error) {
    console.error('전달사항 생성 오류:', error)
    return { error: '전달사항 생성에 실패했습니다.' }
  }

  revalidatePath('/dashboard/announcements')
  revalidatePath('/dashboard')
  return { success: true, data }
}

// 전달사항 수정
export async function updateAnnouncement(announcementId: string, formData: FormData) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  // 교사만 전달사항을 수정할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const priority = formData.get('priority') as string
  const isPinned = formData.get('isPinned') === 'true'

  if (!title || !content) {
    return { error: '제목과 내용은 필수입니다.' }
  }

  const announcementData: AnnouncementUpdate = {
    title,
    content,
    priority: priority as 'high' | 'medium' | 'low',
    is_pinned: isPinned,
  }

  const { data, error } = await (supabase
    .from('announcements') as any)
    .update(announcementData)
    .eq('id', announcementId)
    .select()
    .single()

  if (error) {
    console.error('전달사항 수정 오류:', error)
    return { error: '전달사항 수정에 실패했습니다.' }
  }

  revalidatePath('/dashboard/announcements')
  revalidatePath('/dashboard')
  return { success: true, data }
}

// 전달사항 삭제
export async function deleteAnnouncement(announcementId: string) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  // 교사만 전달사항을 삭제할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const { error } = await (supabase
    .from('announcements') as any)
    .delete()
    .eq('id', announcementId)

  if (error) {
    console.error('전달사항 삭제 오류:', error)
    return { error: '전달사항 삭제에 실패했습니다.' }
  }

  revalidatePath('/dashboard/announcements')
  revalidatePath('/dashboard')
  return { success: true }
}

// 전달사항 목록 조회
export async function getAnnouncements() {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('announcements') as any)
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('전달사항 조회 오류:', error)
    return { error: '전달사항 조회에 실패했습니다.' }
  }

  return { success: true, data }
}

// 가장 최근 전달사항 조회
export async function getLatestAnnouncement() {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('announcements') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116은 결과 없음 에러
    console.error('최근 전달사항 조회 오류:', error)
    return { error: '최근 전달사항 조회에 실패했습니다.' }
  }

  return { success: true, data }
}
