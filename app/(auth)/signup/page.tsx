'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GraduationCap } from 'lucide-react'

/**
 * 회원가입 페이지 (학생 전용)
 * 교사 계정은 관리자가 데이터베이스에서 직접 생성합니다
 */
export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const studentNumber = formData.get('studentNumber') as string

    // 학번 검증
    if (!studentNumber || studentNumber.trim() === '') {
      setError('학번을 입력해주세요.')
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    // 1. 인증 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    if (!authData.user) {
      setError('회원가입에 실패했습니다.')
      setIsLoading(false)
      return
    }

    // 2. users 테이블에 프로필 정보 저장 (항상 학생으로 등록)
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      role: 'student' as const, // 보안상 항상 학생으로 등록
      name,
      student_number: parseInt(studentNumber),
    } as never)

    if (profileError) {
      console.error('프로필 저장 실패:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      setError(`프로필 저장 실패: ${profileError.message}`)
      setIsLoading(false)
      return
    }

    // 회원가입 성공 - 대시보드로 이동
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-background to-muted/20 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-2 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">학생 회원가입</CardTitle>
          <CardDescription>
            2026 Jeannie Class 학급 관리 시스템
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="홍길동"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@school.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="최소 6자 이상"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentNumber">학번</Label>
              <Input
                id="studentNumber"
                name="studentNumber"
                type="number"
                placeholder="예: 1"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '가입 중...' : '가입하기'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                로그인
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
