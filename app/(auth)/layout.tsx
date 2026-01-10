import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '인증 - 2026 Jeannie Class',
  description: '로그인 및 회원가입',
}

/**
 * 인증 페이지 레이아웃
 * - 로그인, 회원가입 페이지에 적용
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  )
}
