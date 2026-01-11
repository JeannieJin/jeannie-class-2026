#!/usr/bin/env tsx

/**
 * Authorization Guard 에이전트
 *
 * Server Actions, API 라우트, RLS 정책의 권한 검증 누락 탐지
 *
 * 검사 항목:
 * - Server Actions에 getCurrentUser() 호출 여부
 * - 역할 기반 접근 제어(RBAC) 검증
 * - 권한 에스컬레이션 위험
 * - 리소스 소유권 검증 (created_by, user_id)
 * - Admin 클라이언트 사용처 권한 확인
 */

import { scanDirectory, readFiles, type ScannedFile } from '../utils/file-scanner'
import {
  createIssue,
  generateReport,
  printReport,
  getExitCode,
  Severity,
  type Issue,
} from '../utils/report-generator'

/**
 * Server Action 함수 분석
 */
interface ServerActionInfo {
  name: string
  hasUseServer: boolean
  hasGetCurrentUser: boolean
  hasRoleCheck: boolean
  hasOwnershipCheck: boolean
  usesAdminClient: boolean
  file: string
  lineNumber: number
}

/**
 * 파일에서 Server Actions 찾기
 */
function findServerActions(file: ScannedFile): ServerActionInfo[] {
  const actions: ServerActionInfo[] = []

  // 'use server' 지시어가 있는지 확인
  const hasUseServerDirective =
    file.content.includes("'use server'") || file.content.includes('"use server"')

  if (!hasUseServerDirective) return actions

  // export async function 패턴 찾기
  const functionPattern = /export\s+async\s+function\s+(\w+)\s*\([^)]*\)\s*{/g
  let match: RegExpExecArray | null

  while ((match = functionPattern.exec(file.content)) !== null) {
    const functionName = match[1]
    const startIndex = match.index
    const lineNumber = file.content.substring(0, startIndex).split('\n').length

    // 함수 본문 추출 (간단하게 다음 export 또는 파일 끝까지)
    const nextExport = file.content.indexOf('export', startIndex + 1)
    const functionBody =
      nextExport === -1
        ? file.content.substring(startIndex)
        : file.content.substring(startIndex, nextExport)

    // 권한 검증 패턴 확인
    const hasGetCurrentUser =
      functionBody.includes('getCurrentUser()') || functionBody.includes('getCurrentUser (')

    const hasRoleCheck =
      functionBody.includes('.role') ||
      functionBody.includes('is_teacher') ||
      functionBody.includes("role === 'teacher'") ||
      functionBody.includes("role === 'student'")

    const hasOwnershipCheck =
      functionBody.includes('created_by') ||
      functionBody.includes('user_id') ||
      functionBody.includes('.id === user.id')

    const usesAdminClient =
      functionBody.includes('createAdminClient') || functionBody.includes('from(\'users\').insert')

    actions.push({
      name: functionName,
      hasUseServer: hasUseServerDirective,
      hasGetCurrentUser,
      hasRoleCheck,
      hasOwnershipCheck,
      usesAdminClient,
      file: file.path,
      lineNumber,
    })
  }

  return actions
}

/**
 * Server Action 권한 검증 분석
 */
function analyzeServerAction(action: ServerActionInfo): Issue[] {
  const issues: Issue[] = []

  // getCurrentUser() 호출 없음
  if (!action.hasGetCurrentUser) {
    issues.push(
      createIssue(
        Severity.HIGH,
        '인증 검증 누락',
        `Server Action '${action.name}'에서 getCurrentUser() 호출이 없습니다`,
        {
          file: action.file,
          line: action.lineNumber,
          suggestion:
            'const user = await getCurrentUser()\nif (!user) return { error: "로그인이 필요합니다" }',
        }
      )
    )
  }

  // Admin 클라이언트 사용 시 권한 체크 없음
  if (action.usesAdminClient && !action.hasRoleCheck) {
    issues.push(
      createIssue(
        Severity.CRITICAL,
        'Admin 권한 미검증',
        `Server Action '${action.name}'에서 Admin 클라이언트를 사용하지만 교사 권한 검증이 없습니다`,
        {
          file: action.file,
          line: action.lineNumber,
          suggestion: "if (user.role !== 'teacher') return { error: '권한이 없습니다' }",
        }
      )
    )
  }

  // 소유권 검증이 필요한 작업 (delete, update)에서 검증 없음
  if (
    (action.name.includes('delete') || action.name.includes('update')) &&
    !action.hasOwnershipCheck &&
    !action.hasRoleCheck
  ) {
    issues.push(
      createIssue(
        Severity.MEDIUM,
        '소유권 검증 누락',
        `Server Action '${action.name}'에서 리소스 소유권 검증이 없습니다`,
        {
          file: action.file,
          line: action.lineNumber,
          suggestion: 'created_by 또는 user_id 필드를 확인하여 소유권을 검증하세요.',
        }
      )
    )
  }

  return issues
}

/**
 * signup 함수의 role 에스컬레이션 검사
 */
function checkRoleEscalation(file: ScannedFile): Issue[] {
  const issues: Issue[] = []

  // signup 함수 찾기
  if (file.path.includes('auth.ts') && file.content.includes('signup')) {
    // role을 클라이언트 입력으로 받는 패턴
    const roleFromFormData = /role\s*=\s*formData\.get\(['"]role['"]\)/
    const roleDirectInsert = /role:\s*role[,\s}]/

    if (roleFromFormData.test(file.content) && roleDirectInsert.test(file.content)) {
      const lineNumber = file.lines.findIndex((line) => roleDirectInsert.test(line)) + 1

      issues.push(
        createIssue(
          Severity.CRITICAL,
          '권한 에스컬레이션 위험',
          'signup 함수에서 클라이언트가 제출한 role을 그대로 사용합니다',
          {
            file: file.path,
            line: lineNumber,
            code: file.lines[lineNumber - 1]?.trim(),
            suggestion:
              "role을 항상 'student'로 설정하세요: role: 'student' as const\n교사 계정은 별도 관리자 페이지에서 생성하세요.",
          }
        )
      )
    }
  }

  return issues
}

/**
 * API 라우트 권한 검증 검사
 */
function checkApiRoutes(file: ScannedFile): Issue[] {
  const issues: Issue[] = []

  // API 라우트 파일인지 확인
  if (!file.path.includes('app/api/')) return issues

  // GET, POST, PUT, DELETE 핸들러 찾기
  const handlers = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

  handlers.forEach((method) => {
    const pattern = new RegExp(`export\\s+async\\s+function\\s+${method}`, 'g')

    if (pattern.test(file.content)) {
      const lineNumber = file.lines.findIndex((line) => pattern.test(line)) + 1
      const handlerStart = file.content.indexOf(`function ${method}`)
      const nextHandler = file.content.indexOf('export async function', handlerStart + 1)
      const handlerBody =
        nextHandler === -1
          ? file.content.substring(handlerStart)
          : file.content.substring(handlerStart, nextHandler)

      // 권한 검증 확인
      const hasAuth =
        handlerBody.includes('getCurrentUser') || handlerBody.includes('auth.getUser')

      if (!hasAuth) {
        issues.push(
          createIssue(
            Severity.HIGH,
            'API 라우트 인증 누락',
            `API 라우트 ${method} 핸들러에 인증 검증이 없습니다`,
            {
              file: file.path,
              line: lineNumber,
              suggestion: '핸들러 시작 부분에 사용자 인증을 추가하세요.',
            }
          )
        )
      }
    }
  })

  return issues
}

/**
 * 메인 스캐너
 */
async function runAuthorizationCheck(targetDir: string = process.cwd()): Promise<void> {
  console.log('🛡️  Authorization Guard 시작...\n')
  console.log(`📁 스캔 대상: ${targetDir}\n`)

  try {
    // Server Actions 및 API 라우트 파일 스캔
    const filePaths = await scanDirectory(targetDir, {
      extensions: ['.ts', '.tsx'],
    })

    // actions 폴더와 api 폴더의 파일만 필터링
    const relevantFiles = filePaths.filter(
      (path) => path.includes('/actions/') || path.includes('/api/')
    )

    console.log(`📄 ${relevantFiles.length}개 관련 파일 발견`)

    // 파일 읽기
    const files = await readFiles(relevantFiles)
    console.log(`✅ 파일 읽기 완료\n`)

    // 권한 검증 이슈 검사
    const allIssues: Issue[] = []

    for (const file of files) {
      // Server Actions 분석
      const actions = findServerActions(file)
      for (const action of actions) {
        const actionIssues = analyzeServerAction(action)
        allIssues.push(...actionIssues)
      }

      // Role 에스컬레이션 검사
      const roleIssues = checkRoleEscalation(file)
      allIssues.push(...roleIssues)

      // API 라우트 검사
      const apiIssues = checkApiRoutes(file)
      allIssues.push(...apiIssues)
    }

    // 리포트 생성 및 출력
    const report = generateReport('Authorization Guard Report', allIssues)
    printReport(report)

    // 종료 코드 설정
    const exitCode = getExitCode(report)

    if (exitCode > 0) {
      console.log(
        `⚠️  ${report.summary.critical + report.summary.high}개의 중요한 권한 검증 이슈가 발견되었습니다.`
      )
      console.log(`\n권장 조치:`)
      console.log(`1. 모든 Server Actions에 getCurrentUser() 추가`)
      console.log(`2. 역할 기반 권한 검증 구현`)
      console.log(`3. signup 함수의 role 에스컬레이션 제거`)
      console.log(`4. Admin 클라이언트 사용처에 교사 권한 검증 추가\n`)
    } else {
      console.log(`✅ 권한 검증이 잘 구현되어 있습니다!\n`)
    }

    process.exit(exitCode)
  } catch (error) {
    console.error('❌ 검사 중 오류 발생:', error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  const targetDir = process.argv[2] || process.cwd()
  runAuthorizationCheck(targetDir)
}

export { runAuthorizationCheck }
