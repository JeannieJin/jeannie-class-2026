import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Bell, FileText, BookOpen } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const SUBJECT_NAMES: Record<string, string> = {
  korean: '국어',
  math: '수학',
  social: '사회',
  science: '과학',
  english: '영어',
  other: '그외'
}

export default async function DashboardPage() {
  const user = (await getCurrentUser()) as any
  const supabase = await createClient()

  // 오늘 요일 (0: 일요일, 1: 월요일, ...)
  const today = new Date()
  const dayOfWeek = today.getDay()

  // 이번주 시작일과 종료일 (월요일 시작)
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

  // 오늘의 시간표 가져오기
  const { data: todayTimetable } = (await supabase
    .from('timetable')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .order('period', { ascending: true })
    .limit(6)) as any

  // 최신 전달사항 가져오기
  const { data: announcements } = (await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)) as any

  // 이번주에 새로 등록된 과제 가져오기
  const { data: weekAssignments } = (await supabase
    .from('assignments')
    .select('subject')
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString())) as any

  // 과목별 과제 개수 계산
  const assignmentsBySubject: Record<string, number> = {}
  if (weekAssignments) {
    weekAssignments.forEach((assignment: any) => {
      assignmentsBySubject[assignment.subject] = (assignmentsBySubject[assignment.subject] || 0) + 1
    })
  }

  // 과제가 있는 과목만 필터링
  const subjectsWithAssignments = Object.entries(assignmentsBySubject)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]) // 개수가 많은 순으로 정렬

  // 이번주 일정 가져오기
  const weekStartDate = weekStart.toISOString().split('T')[0]
  const weekEndDate = weekEnd.toISOString().split('T')[0]

  const { data: weekSchedule } = (await supabase
    .from('events')
    .select('*')
    .gte('event_date', weekStartDate)
    .lte('event_date', weekEndDate)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(5)) as any

  return (
    <div className="space-y-8">
      {/* 환영 메시지 */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          안녕하세요, {user?.name}님! 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          오늘은 무엇을 배우고 싶으신가요?
        </p>
        <p className="text-sm text-muted-foreground">
          자신에게 투자하고 꿈을 향한 첫 걸음을 내딛어보세요
        </p>
      </div>

      {/* 오늘의 수업 & 이번주 과제 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 오늘의 수업 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-bold">오늘의 수업</CardTitle>
            <Link href="/dashboard/timetable">
              <Button size="sm" variant="ghost" className="text-sm">
                전체 시간표
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTimetable && todayTimetable.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {todayTimetable.map((item: any, index: number) => {
                  const colors = [
                    'from-blue-500/20 to-blue-500/5 border-blue-500/30',
                    'from-purple-500/20 to-purple-500/5 border-purple-500/30',
                    'from-green-500/20 to-green-500/5 border-green-500/30',
                    'from-orange-500/20 to-orange-500/5 border-orange-500/30',
                    'from-pink-500/20 to-pink-500/5 border-pink-500/30',
                    'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30',
                  ]
                  const colorClass = colors[index % colors.length]

                  return (
                    <div
                      key={item.id}
                      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 ${colorClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
                          <span className="text-lg font-bold">
                            {item.period}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {item.period}교시
                          </p>
                          <p className="font-semibold text-base truncate">
                            {item.subject || '수업 없음'}
                          </p>
                        </div>
                      </div>
                      {item.teacher_note && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                          {item.teacher_note}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl bg-muted/30">
                <div className="text-center space-y-2">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    오늘은 수업이 없습니다
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 이번주 과제 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-bold">이번주 과제</CardTitle>
            <Link href="/assignments">
              <Button size="sm" variant="ghost" className="text-sm">
                모두 보기
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjectsWithAssignments.length > 0 ? (
              subjectsWithAssignments.map(([subject, count]) => (
                <Link
                  key={subject}
                  href={`/assignments/${subject}`}
                  className="block"
                >
                  <div className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {SUBJECT_NAMES[subject] || subject}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        이번주에 {count}건의 새 과제
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {count}건
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl bg-muted/30">
                <div className="text-center space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    이번주 새로운 과제가 없습니다
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 전달사항 & 일정 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 알림/전달사항 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              알림
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements && announcements.length > 0 ? (
              announcements.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-lg border-l-4 border-primary bg-primary/5 p-4"
                >
                  <div className="flex items-start gap-2">
                    {item.is_pinned && (
                      <Badge variant="secondary" className="shrink-0">고정</Badge>
                    )}
                    {item.priority === 'high' && (
                      <Badge variant="destructive" className="shrink-0">중요</Badge>
                    )}
                  </div>
                  <p className="mt-2 font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {item.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  전달사항이 없습니다
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 이번주 일정 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              이번 주 일정
            </CardTitle>
            <Link href="/dashboard/schedule">
              <Button size="sm" variant="ghost" className="text-sm">
                전체 일정
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {weekSchedule && weekSchedule.length > 0 ? (
              weekSchedule.map((item: any) => {
                const formatTime = (time: string | null) => {
                  if (!time) return null
                  return time.slice(0, 5) // HH:MM 형식으로
                }

                const isHoliday = item.event_type === 'holiday'

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3',
                      isHoliday && 'border-red-200 bg-red-50/30'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg',
                        isHoliday ? 'bg-red-100' : 'bg-primary/10'
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isHoliday ? 'text-red-600' : 'text-primary'
                        )}
                      >
                        {format(new Date(item.event_date), 'd', { locale: ko })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.event_date), 'EEE', { locale: ko })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            'font-medium',
                            isHoliday && 'text-red-600'
                          )}
                        >
                          {item.title}
                        </p>
                        <Badge
                          variant={
                            isHoliday
                              ? 'destructive'
                              : item.event_type === 'class'
                              ? 'default'
                              : 'secondary'
                          }
                          className="shrink-0"
                        >
                          {isHoliday
                            ? '공휴일'
                            : item.event_type === 'class'
                            ? '학급'
                            : '개인'}
                        </Badge>
                      </div>
                      {(item.start_time || item.end_time) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatTime(item.start_time)}
                          {item.start_time && item.end_time && ' ~ '}
                          {formatTime(item.end_time)}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl bg-muted/30">
                <div className="text-center space-y-2">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    이번 주 일정이 없습니다
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
