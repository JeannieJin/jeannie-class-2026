'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { insertRowSingle, updateRowSingle, deleteRow, formData } from '@/lib/supabase/helpers'
import type { Database } from '@/lib/supabase/types'

type LinkInsert = Database['public']['Tables']['links']['Insert']
type LinkUpdate = Database['public']['Tables']['links']['Update']

// 참고링크 생성
export async function createLink(fd: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 교사만 링크를 생성할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  try {
    const linkData: LinkInsert = {
      title: formData.getString(fd, 'title'),
      url: formData.getString(fd, 'url'),
      description: formData.getStringOptional(fd, 'description'),
      category: formData.getStringOptional(fd, 'category') || '기타',
      created_by: user.id,
    }

    const { data, error } = await insertRowSingle(supabase, 'links', linkData)

    if (error) {
      console.error('링크 생성 오류:', error)
      return { error: '링크 생성에 실패했습니다.' }
    }

    revalidatePath('/dashboard/links')
    return { success: true, data }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '링크 생성에 실패했습니다.' }
  }
}

// 참고링크 수정
export async function updateLink(linkId: string, fd: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 교사만 링크를 수정할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  try {
    const linkData: LinkUpdate = {
      title: formData.getString(fd, 'title'),
      url: formData.getString(fd, 'url'),
      description: formData.getStringOptional(fd, 'description'),
      category: formData.getStringOptional(fd, 'category') || '기타',
    }

    const { data, error } = await updateRowSingle(supabase, 'links', linkId, linkData)

    if (error) {
      console.error('링크 수정 오류:', error)
      return { error: '링크 수정에 실패했습니다.' }
    }

    revalidatePath('/dashboard/links')
    return { success: true, data }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '링크 수정에 실패했습니다.' }
  }
}

// 참고링크 삭제
export async function deleteLink(linkId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 교사만 링크를 삭제할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const { error } = await deleteRow(supabase, 'links', linkId)

  if (error) {
    console.error('링크 삭제 오류:', error)
    return { error: '링크 삭제에 실패했습니다.' }
  }

  revalidatePath('/dashboard/links')
  return { success: true }
}
