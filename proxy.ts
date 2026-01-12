import { type NextRequest, NextResponse } from 'next/server'

/**
 * Next.js Proxy (Next.js 16+)
 * - 임시로 단순화 (클라이언트 측 인증 사용)
 */
export async function proxy(request: NextRequest) {
  // 일단 모든 요청을 통과
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 프록시 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - public 폴더의 파일들 (.svg, .png 등)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
