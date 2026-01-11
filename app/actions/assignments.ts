'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'
import { insertRowSingle, updateRowSingle, deleteRow, formData } from '@/lib/supabase/helpers'

type AssignmentInsert = Database['public']['Tables']['assignments']['Insert']
type AssignmentUpdate = Database['public']['Tables']['assignments']['Update']

// 과제 생성
export async function createAssignment(fd: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 교사만 과제를 생성할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  try {
    const subject = formData.getString(fd, 'subject') as 'korean' | 'math' | 'social' | 'science' | 'english' | 'other'

    const assignmentData: AssignmentInsert = {
      title: formData.getString(fd, 'title'),
      description: formData.getStringOptional(fd, 'description'),
      subject,
      due_date: formData.getStringOptional(fd, 'dueDate'),
      total_points: formData.getNumberOptional(fd, 'totalPoints'),
      external_url: formData.getStringOptional(fd, 'externalUrl'),
      created_by: user.id,
    }

    const { data, error } = await insertRowSingle(supabase, 'assignments', assignmentData)

    if (error) {
      console.error('과제 생성 오류:', error)
      return { error: '과제 생성에 실패했습니다.' }
    }

    revalidatePath(`/assignments/${subject}`)
    return { success: true, data }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '과제 생성에 실패했습니다.' }
  }
}

// 과제 수정
export async function updateAssignment(assignmentId: string, fd: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 교사만 과제를 수정할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  try {
    const subject = formData.getString(fd, 'subject') as 'korean' | 'math' | 'social' | 'science' | 'english' | 'other'

    const assignmentData: AssignmentUpdate = {
      title: formData.getString(fd, 'title'),
      description: formData.getStringOptional(fd, 'description'),
      subject,
      due_date: formData.getStringOptional(fd, 'dueDate'),
      total_points: formData.getNumberOptional(fd, 'totalPoints'),
      external_url: formData.getStringOptional(fd, 'externalUrl'),
    }

    const { data, error } = await updateRowSingle(supabase, 'assignments', assignmentId, assignmentData)

    if (error) {
      console.error('과제 수정 오류:', error)
      return { error: '과제 수정에 실패했습니다.' }
    }

    revalidatePath(`/assignments/${subject}`)
    return { success: true, data }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '과제 수정에 실패했습니다.' }
  }
}

// 과제 삭제
export async function deleteAssignment(assignmentId: string, subject: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 교사만 과제를 삭제할 수 있음
  if (!user || user.role !== 'teacher') {
    return { error: '권한이 없습니다.' }
  }

  const { error } = await deleteRow(supabase, 'assignments', assignmentId)

  if (error) {
    console.error('과제 삭제 오류:', error)
    return { error: '과제 삭제에 실패했습니다.' }
  }

  revalidatePath(`/assignments/${subject}`)
  return { success: true }
}
