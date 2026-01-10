'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

// 참고링크 생성
export async function createLink(formData: FormData) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  // 교사만 링크를 생성할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const title = formData.get('title') as string
  const url = formData.get('url') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string

  if (!title || !url) {
    return { error: '사이트 이름과 주소는 필수입니다.' }
  }

  const { data, error } = await (supabase
    .from('links') as any)
    .insert({
      title,
      url,
      description,
      category: category || '기타',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('링크 생성 오류:', error)
    return { error: '링크 생성에 실패했습니다.' }
  }

  revalidatePath('/dashboard/links')
  return { success: true, data }
}

// 참고링크 수정
export async function updateLink(linkId: string, formData: FormData) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  // 교사만 링크를 수정할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const title = formData.get('title') as string
  const url = formData.get('url') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string

  if (!title || !url) {
    return { error: '사이트 이름과 주소는 필수입니다.' }
  }

  const { data, error } = await (supabase
    .from('links') as any)
    .update({
      title,
      url,
      description,
      category: category || '기타',
    })
    .eq('id', linkId)
    .select()
    .single()

  if (error) {
    console.error('링크 수정 오류:', error)
    return { error: '링크 수정에 실패했습니다.' }
  }

  revalidatePath('/dashboard/links')
  return { success: true, data }
}

// 참고링크 삭제
export async function deleteLink(linkId: string) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  // 교사만 링크를 삭제할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const { error } = await (supabase
    .from('links') as any)
    .delete()
    .eq('id', linkId)

  if (error) {
    console.error('링크 삭제 오류:', error)
    return { error: '링크 삭제에 실패했습니다.' }
  }

  revalidatePath('/dashboard/links')
  return { success: true }
}
