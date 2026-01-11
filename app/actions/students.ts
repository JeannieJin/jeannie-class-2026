'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'
import { getCurrentUser } from './auth'

type UserInsert = Database['public']['Tables']['users']['Insert']

export type Student = {
  id: string
  email: string
  name: string
  student_number: number
  created_at: string
}

/**
 * 모든 학생 목록 조회
 */
export async function getAllStudents(): Promise<Student[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('users'))
    .select('id, email, name, student_number, created_at')
    .eq('role', 'student')
    .order('student_number', { ascending: true })

  if (error) {
    console.error('학생 목록 조회 실패:', error)
    throw new Error('학생 목록을 불러오는데 실패했습니다.')
  }

  return data || []
}

/**
 * 학생 추가 (Supabase Auth에 계정 생성 + users 테이블에 정보 추가)
 * 교사만 실행 가능
 */
export async function addStudent(formData: {
  email: string
  password: string
  name: string
  student_number: number
}) {
  // 권한 검증: 교사만 학생 추가 가능
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('로그인이 필요합니다.')
  }

  if (currentUser.role !== 'teacher') {
    throw new Error('교사만 학생을 추가할 수 있습니다.')
  }

  const adminClient = createAdminClient()
  const supabase = await createClient()

  // 1. Supabase Auth에 사용자 생성 (서비스 역할 키 필요)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true, // 이메일 확인 자동 승인
  })

  if (authError) {
    console.error('Auth 사용자 생성 실패:', authError)
    throw new Error('사용자 생성에 실패했습니다: ' + authError.message)
  }

  // 2. users 테이블에 학생 정보 추가
  const userData: UserInsert = {
    id: authData.user.id,
    email: formData.email,
    name: formData.name,
    student_number: formData.student_number,
    role: 'student',
  }

  const { error: insertError } = await supabase.from('users').insert(userData as never)

  if (insertError) {
    console.error('학생 정보 저장 실패:', insertError)
    // Auth 사용자 생성은 성공했으나 users 테이블 삽입 실패
    // 이 경우 생성된 auth 사용자를 삭제해야 할 수도 있음
    throw new Error('학생 정보 저장에 실패했습니다.')
  }

  revalidatePath('/dashboard/students')
  return { success: true }
}

/**
 * 학생 삭제 (users 테이블에서 삭제 + Auth 계정 삭제)
 * 교사만 실행 가능
 */
export async function deleteStudent(studentId: string) {
  // 권한 검증: 교사만 학생 삭제 가능
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('로그인이 필요합니다.')
  }

  if (currentUser.role !== 'teacher') {
    throw new Error('교사만 학생을 삭제할 수 있습니다.')
  }

  const adminClient = createAdminClient()
  const supabase = await createClient()

  // 1. users 테이블에서 삭제
  const { error: deleteError } = await (supabase
    .from('users'))
    .delete()
    .eq('id', studentId)

  if (deleteError) {
    console.error('학생 정보 삭제 실패:', deleteError)
    throw new Error('학생 삭제에 실패했습니다.')
  }

  // 2. Auth 사용자 삭제 (서비스 역할 키 필요)
  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(studentId)

  if (authDeleteError) {
    console.error('Auth 사용자 삭제 실패:', authDeleteError)
    // users 테이블에서는 삭제되었으나 auth에서는 실패
    // 로그는 남기되 사용자에게는 성공으로 표시할 수 있음
  }

  revalidatePath('/dashboard/students')
  return { success: true }
}

/**
 * 학생 비밀번호 변경
 * 교사만 실행 가능
 */
export async function updateStudentPassword(studentId: string, newPassword: string) {
  // 권한 검증: 교사만 학생 비밀번호 변경 가능
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('로그인이 필요합니다.')
  }

  if (currentUser.role !== 'teacher') {
    throw new Error('교사만 학생 비밀번호를 변경할 수 있습니다.')
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.updateUserById(studentId, {
    password: newPassword,
  })

  if (error) {
    console.error('비밀번호 변경 실패:', error)
    throw new Error('비밀번호 변경에 실패했습니다: ' + error.message)
  }

  return { success: true }
}
