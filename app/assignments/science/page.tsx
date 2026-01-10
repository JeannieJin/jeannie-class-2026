import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SubmissionCheckbox } from '@/components/submission-checkbox'
import { Atom, Calendar, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

export default async function ScienceAssignmentsPage() {
  const user: any = await getCurrentUser()
  const supabase = await createClient()

  // 과학 과제 가져오기
  const { data: assignments } = (await supabase
    .from('assignments')
    .select('*')
    .eq('subject', 'science')
    .order('due_date', { ascending: true })) as any

  // 학생인 경우 제출 정보도 가져오기
  let submissions: any[] = []
  if (user?.role === 'student') {
    const { data } = (await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', user.id)) as any
    submissions = data || []
  }

  // 제출 여부 확인 함수
  const isSubmitted = (assignmentId: string) => {
    return submissions.some(sub => sub.assignment_id === assignmentId)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-orange-500/10">
            <Atom className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">과학 과제</h1>
            <p className="text-lg text-muted-foreground">
              과학 과제 목록 및 제출 현황
            </p>
          </div>
        </div>
      </div>

      {/* 과제 목록 */}
      <div className="space-y-4">
        {assignments && assignments.length > 0 ? (
          assignments.map((assignment: any) => {
            const submitted = isSubmitted(assignment.id)
            const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date()

            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 제출 체크박스 (학생만) */}
                    {user?.role === 'student' && (
                      <div className="pt-1">
                        <SubmissionCheckbox
                          assignmentId={assignment.id}
                          initialChecked={submitted}
                        />
                      </div>
                    )}

                    {/* 과제 정보 */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold">{assignment.title}</h3>
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {submitted && (
                            <Badge variant="default" className="bg-green-500">
                              제출 완료
                            </Badge>
                          )}
                          {isOverdue && !submitted && (
                            <Badge variant="destructive">
                              마감
                            </Badge>
                          )}
                          {!isOverdue && !submitted && (
                            <Badge variant="secondary">
                              미제출
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {assignment.due_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              마감: {format(new Date(assignment.due_date), 'PPP', { locale: ko })}
                            </span>
                          </div>
                        )}
                        {assignment.total_points && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{assignment.total_points}점</span>
                          </div>
                        )}
                      </div>

                      {assignment.external_url && (
                        <Link
                          href={assignment.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          과제 링크 열기
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="flex h-48 items-center justify-center">
              <div className="text-center space-y-2">
                <Atom className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-lg text-muted-foreground">
                  등록된 과학 과제가 없습니다
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
