'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

/**
 * 과제 제출
 */
export async function submitAssignment(assignmentId: string, note?: string) {
  const supabase: any = await createClient()
  const user: any = await getCurrentUser()

  if (!user) {
    return { error: '로그인이 필요합니다' }
  }

  // 학생만 제출 가능
  if (user.role !== 'student') {
    return { error: '학생만 과제를 제출할 수 있습니다' }
  }

  // 이미 제출되었는지 확인
  const { data: existingSubmission } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .single()

  if (existingSubmission) {
    return { error: '이미 제출한 과제입니다' }
  }

  // 제출 추가
  const { error } = await supabase
    .from('submissions')
    .insert({
      assignment_id: assignmentId,
      student_id: user.id,
      note: note || null,
    })

  if (error) {
    console.error('제출 오류:', error)
    return { error: '제출 중 오류가 발생했습니다' }
  }

  revalidatePath('/assignments')
  return { success: true }
}

/**
 * 과제 제출 취소
 */
export async function cancelSubmission(assignmentId: string) {
  const supabase: any = await createClient()
  const user: any = await getCurrentUser()

  if (!user) {
    return { error: '로그인이 필요합니다' }
  }

  // 학생만 취소 가능
  if (user.role !== 'student') {
    return { error: '학생만 제출을 취소할 수 있습니다' }
  }

  // 제출 삭제
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)

  if (error) {
    console.error('제출 취소 오류:', error)
    return { error: '제출 취소 중 오류가 발생했습니다' }
  }

  revalidatePath('/assignments')
  return { success: true }
}

/**
 * 과제 제출 상태 토글
 */
export async function toggleSubmission(assignmentId: string) {
  const supabase: any = await createClient()
  const user: any = await getCurrentUser()

  if (!user) {
    return { error: '로그인이 필요합니다' }
  }

  // 학생만 제출 가능
  if (user.role !== 'student') {
    return { error: '학생만 과제를 제출할 수 있습니다' }
  }

  // 기존 제출 여부 확인
  const { data: existingSubmission } = (await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .single())

  if (existingSubmission) {
    // 이미 제출된 경우 삭제
    const { error } = (await supabase
      .from('submissions')
      .delete()
      .eq('id', existingSubmission.id))

    if (error) {
      return { error: '제출 취소 중 오류가 발생했습니다' }
    }

    revalidatePath('/assignments')
    return { success: true, submitted: false }
  } else {
    // 제출되지 않은 경우 추가
    const { error } = (await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: user.id,
        status: 'submitted'
      }))

    if (error) {
      console.error('Submission error:', error)
      return { error: '제출 중 오류가 발생했습니다' }
    }

    revalidatePath('/assignments')
    return { success: true, submitted: true }
  }
}
