/**
 * 리포트 생성 유틸리티
 * 에이전트 검사 결과를 포맷팅
 */

export enum Severity {
  CRITICAL = '🔴',
  HIGH = '🟠',
  MEDIUM = '🟡',
  LOW = '🔵',
  INFO = '⚪',
}

export interface Issue {
  severity: Severity
  category: string
  message: string
  file?: string
  line?: number
  code?: string
  suggestion?: string
}

export interface Report {
  title: string
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
  issues: Issue[]
  timestamp: Date
}

/**
 * 이슈 생성
 */
export function createIssue(
  severity: Severity,
  category: string,
  message: string,
  details?: Partial<Issue>
): Issue {
  return {
    severity,
    category,
    message,
    ...details,
  }
}

/**
 * 리포트 생성
 */
export function generateReport(title: string, issues: Issue[]): Report {
  const summary = {
    total: issues.length,
    critical: issues.filter((i) => i.severity === Severity.CRITICAL).length,
    high: issues.filter((i) => i.severity === Severity.HIGH).length,
    medium: issues.filter((i) => i.severity === Severity.MEDIUM).length,
    low: issues.filter((i) => i.severity === Severity.LOW).length,
  }

  return {
    title,
    summary,
    issues,
    timestamp: new Date(),
  }
}

/**
 * 리포트를 콘솔에 출력
 */
export function printReport(report: Report): void {
  console.log('\n' + '='.repeat(80))
  console.log(`📊 ${report.title}`)
  console.log('='.repeat(80))
  console.log(`\n⏰ 검사 시간: ${report.timestamp.toLocaleString('ko-KR')}`)
  console.log(`\n📈 요약:`)
  console.log(`   총 이슈: ${report.summary.total}개`)
  console.log(`   ${Severity.CRITICAL} 매우 높음: ${report.summary.critical}개`)
  console.log(`   ${Severity.HIGH} 높음: ${report.summary.high}개`)
  console.log(`   ${Severity.MEDIUM} 중간: ${report.summary.medium}개`)
  console.log(`   ${Severity.LOW} 낮음: ${report.summary.low}개`)

  if (report.issues.length === 0) {
    console.log(`\n✅ 발견된 이슈가 없습니다!`)
    console.log('='.repeat(80) + '\n')
    return
  }

  // 심각도별로 그룹화
  const groupedIssues = report.issues.reduce((acc, issue) => {
    const key = issue.severity
    if (!acc[key]) acc[key] = []
    acc[key].push(issue)
    return acc
  }, {} as Record<Severity, Issue[]>)

  // 심각도 순서로 출력
  const severities = [
    Severity.CRITICAL,
    Severity.HIGH,
    Severity.MEDIUM,
    Severity.LOW,
    Severity.INFO,
  ]

  for (const severity of severities) {
    const issues = groupedIssues[severity]
    if (!issues || issues.length === 0) continue

    console.log(`\n${severity} ${getSeverityName(severity)} (${issues.length}개):`)
    console.log('-'.repeat(80))

    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.category}] ${issue.message}`)

      if (issue.file) {
        const location = issue.line ? `${issue.file}:${issue.line}` : issue.file
        console.log(`   📁 위치: ${location}`)
      }

      if (issue.code) {
        console.log(`   💻 코드: ${issue.code}`)
      }

      if (issue.suggestion) {
        console.log(`   💡 권장사항: ${issue.suggestion}`)
      }
    })
  }

  console.log('\n' + '='.repeat(80) + '\n')
}

/**
 * 심각도 이름 반환
 */
function getSeverityName(severity: Severity): string {
  switch (severity) {
    case Severity.CRITICAL:
      return '매우 높음'
    case Severity.HIGH:
      return '높음'
    case Severity.MEDIUM:
      return '중간'
    case Severity.LOW:
      return '낮음'
    case Severity.INFO:
      return '정보'
    default:
      return '알 수 없음'
  }
}

/**
 * 리포트를 JSON 파일로 저장
 */
export function reportToJson(report: Report): string {
  return JSON.stringify(report, null, 2)
}

/**
 * 종료 코드 반환 (CI/CD용)
 */
export function getExitCode(report: Report): number {
  if (report.summary.critical > 0) return 2
  if (report.summary.high > 0) return 1
  return 0
}
