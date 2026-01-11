#!/usr/bin/env tsx

/**
 * Type Safety Guardian 에이전트
 *
 * TypeScript 타입 오류, 'as any' 남용, 데이터베이스 타입 불일치 탐지
 *
 * 검사 항목:
 * - 'as any', '@ts-ignore', '@ts-expect-error' 사용
 * - Supabase 쿼리 타입 검증
 * - FormData 처리 시 타입 안정성
 * - null 체크 누락
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
 * 타입 안정성 이슈 검사
 */
function checkTypeSafety(file: ScannedFile): Issue[] {
  const issues: Issue[] = []

  // 1. 'as any' 사용 검사
  const asAnyPattern = /as\s+any/g
  let match: RegExpExecArray | null

  while ((match = asAnyPattern.exec(file.content)) !== null) {
    const lineNumber = file.content.substring(0, match.index).split('\n').length
    const line = file.lines[lineNumber - 1]

    issues.push(
      createIssue(
        Severity.MEDIUM,
        '타입 무시 (as any)',
        "'as any'로 타입 안정성을 무시했습니다",
        {
          file: file.path,
          line: lineNumber,
          code: line?.trim(),
          suggestion: '적절한 타입 정의를 사용하거나, Database 타입을 활용하세요.',
        }
      )
    )
  }

  // 2. @ts-ignore 검사
  const tsIgnorePattern = /@ts-ignore/g
  while ((match = tsIgnorePattern.exec(file.content)) !== null) {
    const lineNumber = file.content.substring(0, match.index).split('\n').length

    issues.push(
      createIssue(Severity.MEDIUM, '타입 검사 무시', '@ts-ignore를 사용했습니다', {
        file: file.path,
        line: lineNumber,
        suggestion: '타입 문제의 근본 원인을 해결하세요.',
      })
    )
  }

  // 3. @ts-expect-error 검사
  const tsExpectErrorPattern = /@ts-expect-error/g
  while ((match = tsExpectErrorPattern.exec(file.content)) !== null) {
    const lineNumber = file.content.substring(0, match.index).split('\n').length

    issues.push(
      createIssue(Severity.LOW, '타입 오류 예상', '@ts-expect-error를 사용했습니다', {
        file: file.path,
        line: lineNumber,
        suggestion: '타입 문제가 해결되었는지 확인하세요.',
      })
    )
  }

  // 4. Supabase 쿼리 타입 검증
  const supabaseQueryPattern = /\.from\(['"](\w+)['"]\)/g
  while ((match = supabaseQueryPattern.exec(file.content)) !== null) {
    const tableName = match[1]
    const lineNumber = file.content.substring(0, match.index).split('\n').length
    const line = file.lines[lineNumber - 1]

    // .returns<...>() 또는 타입 단언이 있는지 확인
    const hasTypeAssertion =
      line?.includes('.returns<') || line?.includes('as Database') || line?.includes('as any')

    if (!hasTypeAssertion && !line?.includes(`from('${tableName}') as any`)) {
      // 타입 명시가 없지만 중요도는 낮음 (RLS가 있으므로)
      issues.push(
        createIssue(
          Severity.LOW,
          'Supabase 쿼리 타입 미지정',
          `테이블 '${tableName}'에 대한 쿼리에 타입이 명시되지 않았습니다`,
          {
            file: file.path,
            line: lineNumber,
            suggestion: `.returns<Database['public']['Tables']['${tableName}']['Row']>()를 추가하세요.`,
          }
        )
      )
    }
  }

  // 5. FormData 타입 검증
  if (file.content.includes('FormData')) {
    const formDataGetPattern = /formData\.get\(['"](\w+)['"]\)/g

    while ((match = formDataGetPattern.exec(file.content)) !== null) {
      const fieldName = match[1]
      const lineNumber = file.content.substring(0, match.index).split('\n').length
      const line = file.lines[lineNumber - 1]

      // 타입 단언이나 null 체크가 있는지 확인
      const hasTypeCheck =
        line?.includes('as string') ||
        line?.includes('as number') ||
        line?.includes('?.') ||
        line?.includes('??') ||
        line?.includes('||')

      if (!hasTypeCheck) {
        issues.push(
          createIssue(
            Severity.LOW,
            'FormData 타입 미검증',
            `FormData.get('${fieldName}')의 타입이 검증되지 않았습니다`,
            {
              file: file.path,
              line: lineNumber,
              suggestion: 'as string 또는 null 체크를 추가하세요.',
            }
          )
        )
      }
    }
  }

  // 6. 위험한 타입 단언
  const dangerousAssertions = [
    { pattern: /as\s+unknown\s+as/g, message: "'as unknown as'를 사용했습니다" },
    { pattern: /as\s+never/g, message: "'as never'를 사용했습니다" },
  ]

  dangerousAssertions.forEach(({ pattern, message }) => {
    while ((match = pattern.exec(file.content)) !== null) {
      const lineNumber = file.content.substring(0, match.index).split('\n').length

      issues.push(
        createIssue(Severity.MEDIUM, '위험한 타입 단언', message, {
          file: file.path,
          line: lineNumber,
          suggestion: '적절한 타입 가드를 사용하세요.',
        })
      )
    }
  })

  return issues
}

/**
 * 메인 스캐너
 */
async function runTypeSafetyCheck(targetDir: string = process.cwd()): Promise<void> {
  console.log('📝 Type Safety Guardian 시작...\n')
  console.log(`📁 스캔 대상: ${targetDir}\n`)

  try {
    // TypeScript 파일 스캔
    const filePaths = await scanDirectory(targetDir, {
      extensions: ['.ts', '.tsx'],
    })

    console.log(`📄 ${filePaths.length}개 파일 발견`)

    // 파일 읽기
    const files = await readFiles(filePaths)
    console.log(`✅ 파일 읽기 완료\n`)

    // 타입 안정성 검사
    const allIssues: Issue[] = []

    for (const file of files) {
      const issues = checkTypeSafety(file)
      allIssues.push(...issues)
    }

    // 리포트 생성 및 출력
    const report = generateReport('Type Safety Guardian Report', allIssues)
    printReport(report)

    // 종료 코드 설정
    const exitCode = getExitCode(report)

    if (exitCode > 0) {
      console.log(
        `⚠️  ${report.summary.medium + report.summary.low}개의 타입 안정성 이슈가 발견되었습니다.`
      )
      console.log(`\n권장 조치:`)
      console.log(`1. 'as any' 사용을 적절한 타입으로 대체`)
      console.log(`2. @ts-ignore 제거 및 근본 원인 해결`)
      console.log(`3. Supabase 쿼리에 타입 명시`)
      console.log(`4. FormData 처리 시 타입 검증 추가\n`)
    } else {
      console.log(`✅ 타입 안정성이 잘 유지되고 있습니다!\n`)
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
  runTypeSafetyCheck(targetDir)
}

export { runTypeSafetyCheck }
