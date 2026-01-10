'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'

type AssignmentInsert = Database['public']['Tables']['assignments']['Insert']
type AssignmentUpdate = Database['public']['Tables']['assignments']['Update']

// 과제 생성
export async function createAssignment(formData: FormData) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  // 교사만 과제를 생성할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const subject = formData.get('subject') as string
  const dueDate = formData.get('dueDate') as string
  const totalPoints = formData.get('totalPoints') as string
  const externalUrl = formData.get('externalUrl') as string

  if (!title || !subject) {
    return { error: '제목과 과목은 필수입니다.' }
  }

  const assignmentData: AssignmentInsert = {
    title,
    description: description || null,
    subject: subject as 'korean' | 'math' | 'social' | 'science' | 'english' | 'other',
    due_date: dueDate || null,
    total_points: totalPoints ? parseInt(totalPoints) : null,
    external_url: externalUrl || null,
    created_by: user.id,
  }

  const { data, error } = await (supabase
    .from('assignments') as any)
    .insert(assignmentData)
    .select()
    .single()

  if (error) {
    console.error('과제 생성 오류:', error)
    return { error: '과제 생성에 실패했습니다.' }
  }

  revalidatePath(`/assignments/${subject}`)
  return { success: true, data }
}

// 과제 수정
export async function updateAssignment(assignmentId: string, formData: FormData) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  // 교사만 과제를 수정할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const subject = formData.get('subject') as string
  const dueDate = formData.get('dueDate') as string
  const totalPoints = formData.get('totalPoints') as string
  const externalUrl = formData.get('externalUrl') as string

  if (!title || !subject) {
    return { error: '제목과 과목은 필수입니다.' }
  }

  const assignmentData: AssignmentUpdate = {
    title,
    description: description || null,
    subject: subject as 'korean' | 'math' | 'social' | 'science' | 'english' | 'other',
    due_date: dueDate || null,
    total_points: totalPoints ? parseInt(totalPoints) : null,
    external_url: externalUrl || null,
  }

  const { data, error } = await (supabase
    .from('assignments') as any)
    .update(assignmentData)
    .eq('id', assignmentId)
    .select()
    .single()

  if (error) {
    console.error('과제 수정 오류:', error)
    return { error: '과제 수정에 실패했습니다.' }
  }

  revalidatePath(`/assignments/${subject}`)
  return { success: true, data }
}

// 과제 삭제
export async function deleteAssignment(assignmentId: string, subject: string) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  // 교사만 과제를 삭제할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const { error } = await (supabase
    .from('assignments') as any)
    .delete()
    .eq('id', assignmentId)

  if (error) {
    console.error('과제 삭제 오류:', error)
    return { error: '과제 삭제에 실패했습니다.' }
  }

  revalidatePath(`/assignments/${subject}`)
  return { success: true }
}
