'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Bell, FileText, CalendarDays, Link2, GraduationCap } from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: '시간표 관리',
    description: '주간 수업 시간표를 한눈에 확인하고 관리할 수 있습니다.',
  },
  {
    icon: Bell,
    title: '전달사항',
    description: '중요한 공지사항과 알림을 실시간으로 받아볼 수 있습니다.',
  },
  {
    icon: FileText,
    title: '과제 관리',
    description: '과제 제출 현황과 마감일을 효율적으로 관리합니다.',
  },
  {
    icon: CalendarDays,
    title: '일정 관리',
    description: '학급 행사와 중요한 일정을 놓치지 않게 관리합니다.',
  },
  {
    icon: Link2,
    title: '참고 링크',
    description: '학습에 도움이 되는 유용한 자료와 링크를 공유합니다.',
  },
  {
    icon: GraduationCap,
    title: '성적 관리',
    description: '학생들의 성적과 학습 진도를 체계적으로 관리합니다.',
  },
]

/**
 * 메인 랜딩 페이지
 */
export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    async function checkUser() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
      } catch (error) {
        // 세션 확인 실패 시 로그인하지 않은 것으로 처리
        console.error('세션 확인 중 오류:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-lg text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      {/* 헤더 */}
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Jeannie Class 2026</h1>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button onClick={() => router.push('/dashboard')}>
              대시보드로 이동
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button>회원가입</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="container py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-5xl font-bold tracking-tight">
            학급 관리의 새로운 기준
          </h2>
          <p className="text-xl text-muted-foreground">
            2026 Jeannie Class는 교사와 학생을 위한 올인원 학급 관리 플랫폼입니다.
            효율적인 소통과 체계적인 학습 관리를 경험해보세요.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => router.push('/dashboard')}>
                대시보드 바로가기
              </Button>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg">시작하기</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    로그인
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="container py-20">
        <div className="mb-12 text-center">
          <h3 className="text-3xl font-bold">주요 기능</h3>
          <p className="mt-2 text-muted-foreground">
            학급 운영에 필요한 모든 기능을 한곳에서
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-2 transition-all hover:border-primary hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="container py-20">
        <Card className="border-2 border-primary/20 bg-linear-to-r from-primary/5 to-primary/10">
          <CardContent className="p-12 text-center">
            <h3 className="mb-4 text-3xl font-bold">
              지금 바로 시작하세요
            </h3>
            <p className="mb-6 text-lg text-muted-foreground">
              2026 Jeannie Class와 함께 더 효율적인 학급 운영을 경험해보세요.
            </p>
            {isAuthenticated ? (
              <Button size="lg" onClick={() => router.push('/dashboard')}>
                대시보드로 이동
              </Button>
            ) : (
              <Link href="/signup">
                <Button size="lg">무료로 시작하기</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 푸터 */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 Jeannie Class. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
