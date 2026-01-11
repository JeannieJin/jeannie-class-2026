#!/usr/bin/env tsx

/**
 * Security Scanner 에이전트
 *
 * 시크릿 누출, API 키 노출, 보안 취약점 탐지
 *
 * 검사 항목:
 * - 환경 변수 파일의 API 키, 토큰 노출
 * - 하드코딩된 비밀번호, API 키
 * - Supabase URL, anon key, service role key
 * - JWT 토큰
 * - 클라이언트 번들에 서버 전용 코드 포함
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

// 민감한 정보 탐지 패턴
const SECURITY_PATTERNS = {
  // Supabase URL
  supabaseUrl: {
    pattern: /https:\/\/[a-z0-9]+\.supabase\.co/gi,
    category: 'Supabase URL 노출',
    severity: Severity.MEDIUM,
    message: 'Supabase 프로젝트 URL이 노출되었습니다',
  },

  // JWT 토큰
  jwtToken: {
    pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
    category: 'JWT 토큰 노출',
    severity: Severity.CRITICAL,
    message: 'JWT 토큰이 노출되었습니다',
  },

  // API 키 (32자 이상의 영숫자)
  apiKey: {
    pattern: /(?:api[_-]?key|apikey|key)["\s:=]+([a-zA-Z0-9_-]{32,})/gi,
    category: 'API 키 노출',
    severity: Severity.CRITICAL,
    message: 'API 키가 하드코딩되어 있습니다',
  },

  // 비밀번호
  password: {
    pattern: /password\s*[:=]\s*["']([^"']{4,})["']/gi,
    category: '비밀번호 하드코딩',
    severity: Severity.HIGH,
    message: '비밀번호가 하드코딩되어 있습니다',
  },

  // Private Key
  privateKey: {
    pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/gi,
    category: 'Private Key 노출',
    severity: Severity.CRITICAL,
    message: 'Private Key가 노출되었습니다',
  },

  // AWS 키
  awsAccessKey: {
    pattern: /AKIA[0-9A-Z]{16}/g,
    category: 'AWS Access Key 노출',
    severity: Severity.CRITICAL,
    message: 'AWS Access Key가 노출되었습니다',
  },

  // 하드코딩된 토큰
  hardcodedToken: {
    pattern: /token\s*[:=]\s*["']([a-zA-Z0-9_-]{20,})["']/gi,
    category: '토큰 하드코딩',
    severity: Severity.HIGH,
    message: '토큰이 하드코딩되어 있습니다',
  },
}

// Supabase 특정 패턴 (환경 변수 파일용)
const SUPABASE_ENV_PATTERNS = {
  serviceRoleKey: {
    pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)/,
    severity: Severity.CRITICAL,
    message: 'Supabase Service Role Key가 환경 변수 파일에 노출되었습니다',
  },
  anonKey: {
    pattern: /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+)/,
    severity: Severity.HIGH,
    message: 'Supabase Anon Key가 환경 변수 파일에 노출되었습니다',
  },
}

/**
 * 파일에서 보안 이슈 검사
 */
function scanFileForSecrets(file: ScannedFile): Issue[] {
  const issues: Issue[] = []
  const isEnvFile = file.path.includes('.env')

  // 환경 변수 파일은 특별 처리
  if (isEnvFile) {
    // Supabase 키 확인
    for (const [key, config] of Object.entries(SUPABASE_ENV_PATTERNS)) {
      const match = file.content.match(config.pattern)
      if (match) {
        const lineNumber = file.lines.findIndex((line) => line.includes(match[0])) + 1

        issues.push(
          createIssue(config.severity, 'Supabase 키 노출', config.message, {
            file: file.path,
            line: lineNumber,
            code: match[0].substring(0, 50) + '...',
            suggestion: '이 파일을 .gitignore에 추가하고, Git 이력에서 제거하세요. Supabase 대시보드에서 키를 재발급하세요.',
          })
        )
      }
    }
  }

  // 일반 패턴 검사
  for (const [patternName, config] of Object.entries(SECURITY_PATTERNS)) {
    let match: RegExpExecArray | null

    while ((match = config.pattern.exec(file.content)) !== null) {
      const matchedText = match[0]

      // JWT 토큰은 환경 변수 파일에서만 CRITICAL
      let severity = config.severity
      if (patternName === 'jwtToken' && !isEnvFile) {
        severity = Severity.MEDIUM
      }

      const lineNumber = file.lines.findIndex((line) => line.includes(matchedText)) + 1

      issues.push(
        createIssue(severity, config.category, config.message, {
          file: file.path,
          line: lineNumber,
          code: matchedText.length > 50 ? matchedText.substring(0, 50) + '...' : matchedText,
          suggestion: isEnvFile
            ? '환경 변수 파일을 .gitignore에 추가하고 Git 이력에서 제거하세요.'
            : '하드코딩된 시크릿을 환경 변수로 이동하세요.',
        })
      )
    }
  }

  return issues
}

/**
 * 클라이언트 컴포넌트에서 서버 전용 코드 사용 검사
 */
function checkClientServerMix(file: ScannedFile): Issue[] {
  const issues: Issue[] = []

  // 'use client' 지시어가 있는 파일만 검사
  if (!file.content.includes("'use client'") && !file.content.includes('"use client"')) {
    return issues
  }

  // 서버 전용 모듈 import 패턴
  const serverModules = [
    /from ['"]@\/lib\/supabase\/server['"]/,
    /from ['"]@\/lib\/supabase\/admin['"]/,
    /createClient.*from.*server/,
  ]

  serverModules.forEach((pattern) => {
    if (pattern.test(file.content)) {
      const lineNumber = file.lines.findIndex((line) => pattern.test(line)) + 1

      issues.push(
        createIssue(
          Severity.HIGH,
          '클라이언트/서버 코드 혼합',
          '클라이언트 컴포넌트에서 서버 전용 모듈을 import 했습니다',
          {
            file: file.path,
            line: lineNumber,
            code: file.lines[lineNumber - 1],
            suggestion: 'lib/supabase/client.ts를 사용하거나, Server Component로 변경하세요.',
          }
        )
      )
    }
  })

  return issues
}

/**
 * 메인 스캐너
 */
async function runSecurityScan(targetDir: string = process.cwd()): Promise<void> {
  console.log('🔍 Security Scanner 시작...\n')
  console.log(`📁 스캔 대상: ${targetDir}\n`)

  try {
    // 파일 스캔
    const filePaths = await scanDirectory(targetDir, {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      includeHidden: true, // .env 파일을 포함하기 위해
    })

    console.log(`📄 ${filePaths.length}개 파일 발견`)

    // 파일 읽기
    const files = await readFiles(filePaths)
    console.log(`✅ 파일 읽기 완료\n`)

    // 보안 이슈 검사
    const allIssues: Issue[] = []

    for (const file of files) {
      const secretIssues = scanFileForSecrets(file)
      const mixIssues = checkClientServerMix(file)

      allIssues.push(...secretIssues, ...mixIssues)
    }

    // 리포트 생성 및 출력
    const report = generateReport('Security Scanner Report', allIssues)
    printReport(report)

    // 종료 코드 설정
    const exitCode = getExitCode(report)

    if (exitCode > 0) {
      console.log(`⚠️  ${report.summary.critical + report.summary.high}개의 중요한 보안 이슈가 발견되었습니다.`)
      console.log(`\n권장 조치:`)
      console.log(`1. .env 파일들을 .gitignore에 추가`)
      console.log(`2. Git 이력에서 시크릿 제거 (git filter-branch 또는 BFG)`)
      console.log(`3. 노출된 API 키 재발급`)
      console.log(`4. 하드코딩된 시크릿을 환경 변수로 이동\n`)
    } else {
      console.log(`✅ 심각한 보안 이슈가 발견되지 않았습니다!\n`)
    }

    process.exit(exitCode)
  } catch (error) {
    console.error('❌ 스캔 중 오류 발생:', error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  const targetDir = process.argv[2] || process.cwd()
  runSecurityScan(targetDir)
}

export { runSecurityScan }
