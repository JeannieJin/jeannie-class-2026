import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default async function AssignmentsPage() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 과제 목록 가져오기
  const { data: assignments } = (await supabase
    .from('assignments')
    .select('*')
    .order('due_date', { ascending: true }))

  // 학생인 경우 제출 여부 확인
  let submissions: any[] = []
  if (user?.role === 'student') {
    const { data } = (await supabase
      .from('submissions')
      .select('assignment_id, status')
      .eq('student_id', user.id))
    submissions = data || []
  }

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = submissions.find((s) => s.assignment_id === assignmentId)
    return submission?.status || null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">과제</h1>
        <p className="text-muted-foreground">과제 목록과 제출 현황을 확인하세요</p>
      </div>

      <div className="space-y-4">
        {assignments && assignments.length > 0 ? (
          assignments.map((item: any) => {
            const isPastDue = new Date(item.due_date) < new Date()
            const submissionStatus = user?.role === 'student' ? getSubmissionStatus(item.id) : null

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle>{item.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          마감: {format(new Date(item.due_date), 'PPP p', { locale: ko })}
                        </p>
                        {isPastDue && (
                          <Badge variant="destructive">마감됨</Badge>
                        )}
                        {!isPastDue && (
                          <Badge variant="default">진행중</Badge>
                        )}
                        {submissionStatus === 'submitted' && (
                          <Badge variant="secondary">제출완료</Badge>
                        )}
                        {submissionStatus === 'graded' && (
                          <Badge variant="outline">채점완료</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="whitespace-pre-wrap">{item.description}</p>
                  {item.total_points && (
                    <p className="text-sm text-muted-foreground">
                      배점: {item.total_points}점
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">과제가 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
