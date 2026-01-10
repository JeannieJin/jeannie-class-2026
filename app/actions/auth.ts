'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * 로그인 Server Action
 */
export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * 회원가입 Server Action
 */
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as 'teacher' | 'student'
  const studentNumber = formData.get('studentNumber') as string | null

  // 1. 인증 사용자 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: '회원가입에 실패했습니다.' }
  }

  // 2. users 테이블에 프로필 정보 저장
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    role,
    name,
    student_number: studentNumber ? parseInt(studentNumber) : null,
  } as any)

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * 로그아웃 Server Action
 */
export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // users 테이블에서 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
