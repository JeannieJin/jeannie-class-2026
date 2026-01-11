'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'
import { insertRowSingle, updateRowSingle, deleteRow, formData } from '@/lib/supabase/helpers'

type AnnouncementInsert = Database['public']['Tables']['announcements']['Insert']
type AnnouncementUpdate = Database['public']['Tables']['announcements']['Update']

// 전달사항 생성
export async function createAnnouncement(fd: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 교사만 전달사항을 생성할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  try {
    const announcementData: AnnouncementInsert = {
      title: formData.getString(fd, 'title'),
      content: formData.getString(fd, 'content'),
      priority: (formData.getStringOptional(fd, 'priority') || 'medium') as 'high' | 'medium' | 'low',
      is_pinned: formData.getBoolean(fd, 'isPinned'),
      created_by: user.id,
    }

    const { data, error } = await insertRowSingle(supabase, 'announcements', announcementData)

    if (error) {
      console.error('전달사항 생성 오류:', error)
      return { error: '전달사항 생성에 실패했습니다.' }
    }

    revalidatePath('/dashboard/announcements')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '전달사항 생성에 실패했습니다.' }
  }
}

// 전달사항 수정
export async function updateAnnouncement(announcementId: string, fd: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 교사만 전달사항을 수정할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  try {
    const announcementData: AnnouncementUpdate = {
      title: formData.getString(fd, 'title'),
      content: formData.getString(fd, 'content'),
      priority: (formData.getStringOptional(fd, 'priority') || 'medium') as 'high' | 'medium' | 'low',
      is_pinned: formData.getBoolean(fd, 'isPinned'),
    }

    const { data, error } = await updateRowSingle(supabase, 'announcements', announcementId, announcementData)

    if (error) {
      console.error('전달사항 수정 오류:', error)
      return { error: '전달사항 수정에 실패했습니다.' }
    }

    revalidatePath('/dashboard/announcements')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '전달사항 수정에 실패했습니다.' }
  }
}

// 전달사항 삭제
export async function deleteAnnouncement(announcementId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 교사만 전달사항을 삭제할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const { error } = await deleteRow(supabase, 'announcements', announcementId)

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
  const user = await getCurrentUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const { data, error } = await (supabase
    .from('announcements'))
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
  const user = await getCurrentUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const { data, error } = await (supabase
    .from('announcements'))
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
