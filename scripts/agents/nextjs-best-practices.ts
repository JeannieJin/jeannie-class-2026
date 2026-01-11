#!/usr/bin/env tsx

/**
 * Next.js Best Practices 에이전트
 *
 * Next.js 15 베스트 프랙티스 준수, Server/Client 컴포넌트 분리, 성능 최적화
 *
 * 검사 항목:
 * - 'use client' / 'use server' 지시어 사용
 * - Server Component에서 클라이언트 코드 사용
 * - 불필요한 클라이언트 렌더링
 * - 이미지 최적화 (next/image)
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
 * Server/Client 컴포넌트 분리 검사
 */
function checkComponentDirectives(file: ScannedFile): Issue[] {
  const issues: Issue[] = []

  const hasUseClient =
    file.content.includes("'use client'") || file.content.includes('"use client"')
  const hasUseServer =
    file.content.includes("'use server'") || file.content.includes('"use server"')

  // 컴포넌트 파일인지 확인 (.tsx 파일)
  if (!file.path.endsWith('.tsx')) return issues

  // 클라이언트 훅 사용 패턴
  const clientHooks = ['useState', 'useEffect', 'useReducer', 'useCallback', 'useMemo', 'useRef']

  const usesClientHooks = clientHooks.some((hook) => file.content.includes(hook))

  // 클라이언트 훅을 사용하지만 'use client'가 없음
  if (usesClientHooks && !hasUseClient) {
    const lineNumber = file.lines.findIndex((line) => clientHooks.some((hook) => line.includes(hook))) + 1

    issues.push(
      createIssue(
        Severity.HIGH,
        "'use client' 지시어 누락",
        "클라이언트 훅을 사용하지만 'use client' 지시어가 없습니다",
        {
          file: file.path,
          line: lineNumber,
          suggestion: "파일 최상단에 'use client'를 추가하세요.",
        }
      )
    )
  }

  // 'use client'가 있지만 클라이언트 기능을 사용하지 않음
  if (hasUseClient && !usesClientHooks && !file.content.includes('onClick') && !file.content.includes('onChange')) {
    issues.push(
      createIssue(
        Severity.LOW,
        '불필요한 클라이언트 렌더링',
        "'use client'가 있지만 클라이언트 기능을 사용하지 않습니다",
        {
          file: file.path,
          line: 1,
          suggestion: 'Server Component로 변경하여 성능을 개선하세요.',
        }
      )
    )
  }

  return issues
}

/**
 * 이미지 최적화 검사
 */
function checkImageOptimization(file: ScannedFile): Issue[] {
  const issues: Issue[] = []

  // <img> 태그 사용 검사
  const imgTagPattern = /<img\s+[^>]*src=/g
  let match: RegExpExecArray | null

  while ((match = imgTagPattern.exec(file.content)) !== null) {
    const lineNumber = file.content.substring(0, match.index).split('\n').length

    issues.push(
      createIssue(
        Severity.MEDIUM,
        '이미지 최적화 미사용',
        '<img> 태그 대신 next/image의 Image 컴포넌트를 사용하세요',
        {
          file: file.path,
          line: lineNumber,
          suggestion: "import Image from 'next/image'를 사용하세요.",
        }
      )
    )
  }

  return issues
}

/**
 * 중복 데이터 페칭 검사
 */
function checkDataFetching(file: ScannedFile): Issue[] {
  const issues: Issue[] = []

  // 같은 함수를 여러 번 호출하는 패턴
  const functionCalls = file.content.match(/await\s+(\w+)\(/g)

  if (functionCalls) {
    const callCounts = new Map<string, number>()

    functionCalls.forEach((call) => {
      const funcName = call.replace('await ', '').replace('(', '')
      callCounts.set(funcName, (callCounts.get(funcName) || 0) + 1)
    })

    callCounts.forEach((count, funcName) => {
      if (count > 2 && funcName.startsWith('get')) {
        // 같은 데이터 페칭 함수를 3번 이상 호출
        issues.push(
          createIssue(
            Severity.LOW,
            '중복 데이터 페칭',
            `'${funcName}' 함수를 ${count}번 호출하고 있습니다`,
            {
              file: file.path,
              suggestion: '데이터를 한 번만 가져와서 재사용하세요.',
            }
          )
        )
      }
    })
  }

  return issues
}

/**
 * Server Action 사용 검사
 */
function checkServerActions(file: ScannedFile): Issue[] {
  const issues: Issue[] = []

  // form action에서 직접 API 호출하는 패턴 (안티패턴)
  if (file.content.includes('<form') && file.content.includes('onSubmit')) {
    const lineNumber = file.lines.findIndex((line) => line.includes('<form')) + 1
    const formSection = file.content.substring(
      file.content.indexOf('<form'),
      file.content.indexOf('</form>') + 7
    )

    // fetch 또는 axios 사용 확인
    if (formSection.includes('fetch(') || formSection.includes('axios')) {
      issues.push(
        createIssue(
          Severity.MEDIUM,
          'Server Action 미사용',
          'form에서 직접 API를 호출하는 대신 Server Action을 사용하세요',
          {
            file: file.path,
            line: lineNumber,
            suggestion: "action={serverAction} 형태로 Server Action을 사용하세요.",
          }
        )
      )
    }
  }

  return issues
}

/**
 * 메인 스캐너
 */
async function runNextJsCheck(targetDir: string = process.cwd()): Promise<void> {
  console.log('⚡ Next.js Best Practices 검사 시작...\n')
  console.log(`📁 스캔 대상: ${targetDir}\n`)

  try {
    // React/Next.js 컴포넌트 파일 스캔
    const filePaths = await scanDirectory(targetDir, {
      extensions: ['.tsx', '.jsx'],
    })

    console.log(`📄 ${filePaths.length}개 파일 발견`)

    // 파일 읽기
    const files = await readFiles(filePaths)
    console.log(`✅ 파일 읽기 완료\n`)

    // Best Practices 검사
    const allIssues: Issue[] = []

    for (const file of files) {
      const directiveIssues = checkComponentDirectives(file)
      const imageIssues = checkImageOptimization(file)
      const fetchingIssues = checkDataFetching(file)
      const actionIssues = checkServerActions(file)

      allIssues.push(...directiveIssues, ...imageIssues, ...fetchingIssues, ...actionIssues)
    }

    // 리포트 생성 및 출력
    const report = generateReport('Next.js Best Practices Report', allIssues)
    printReport(report)

    // 종료 코드 설정
    const exitCode = getExitCode(report)

    if (exitCode > 0) {
      console.log(`⚠️  ${allIssues.length}개의 개선 가능한 항목이 발견되었습니다.`)
      console.log(`\n권장 조치:`)
      console.log(`1. 'use client' 지시어 적절히 사용`)
      console.log(`2. next/image로 이미지 최적화`)
      console.log(`3. Server Actions 활용`)
      console.log(`4. 중복 데이터 페칭 제거\n`)
    } else {
      console.log(`✅ Next.js 베스트 프랙티스를 잘 따르고 있습니다!\n`)
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
  runNextJsCheck(targetDir)
}

export { runNextJsCheck }
