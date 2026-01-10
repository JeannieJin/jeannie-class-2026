import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SubmissionCheckbox } from '@/components/submission-checkbox'
import { AssignmentFormDialog } from '@/components/assignment-form-dialog'
import { AssignmentDeleteButton } from '@/components/assignment-delete-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BookOpen, Calendar, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

export default async function KoreanAssignmentsPage() {
  const user: any = await getCurrentUser()
  const supabase = await createClient()

  // 국어 과제 가져오기
  const { data: assignments } = (await supabase
    .from('assignments')
    .select('*')
    .eq('subject', 'korean')
    .order('created_at', { ascending: false })) as any

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">국어 과제</h1>
              <p className="text-lg text-muted-foreground">
                국어 과제 목록 및 제출 현황
              </p>
            </div>
          </div>
          {user?.role === 'teacher' && (
            <AssignmentFormDialog subject="korean" />
          )}
        </div>
      </div>

      {/* 과제 목록 테이블 */}
      <Card>
        <CardContent className="p-0">
          {assignments && assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {user?.role === 'student' && (
                    <TableHead className="w-12">제출</TableHead>
                  )}
                  <TableHead className="w-12">번호</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-40">마감일</TableHead>
                  <TableHead className="w-32 text-center">상태</TableHead>
                  {user?.role === 'teacher' && (
                    <TableHead className="w-24 text-center">작업</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment: any, index: number) => {
                  const submitted = isSubmitted(assignment.id)
                  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date()

                  return (
                    <TableRow key={assignment.id} className="hover:bg-muted/50">
                      {/* 제출 체크박스 (학생만) */}
                      {user?.role === 'student' && (
                        <TableCell>
                          <SubmissionCheckbox
                            assignmentId={assignment.id}
                            initialChecked={submitted}
                          />
                        </TableCell>
                      )}

                      {/* 번호 */}
                      <TableCell className="font-medium text-muted-foreground">
                        {assignments.length - index}
                      </TableCell>

                      {/* 제목 및 상세 정보 */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold">{assignment.title}</div>
                          {assignment.description && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {assignment.description}
                            </div>
                          )}
                          {assignment.external_url && (
                            <Link
                              href={assignment.external_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              링크 열기
                            </Link>
                          )}
                        </div>
                      </TableCell>

                      {/* 마감일 */}
                      <TableCell>
                        {assignment.due_date ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(assignment.due_date), 'yy.MM.dd HH:mm', { locale: ko })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      {/* 상태 */}
                      <TableCell className="text-center">
                        {user?.role === 'student' && (
                          <>
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
                          </>
                        )}
                        {user?.role === 'teacher' && (
                          <Badge variant="outline">
                            {format(new Date(assignment.created_at), 'yy.MM.dd', { locale: ko })}
                          </Badge>
                        )}
                      </TableCell>

                      {/* 작업 버튼 (교사만) */}
                      {user?.role === 'teacher' && (
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <AssignmentFormDialog
                              subject="korean"
                              mode="edit"
                              assignment={assignment}
                            />
                            <AssignmentDeleteButton
                              assignmentId={assignment.id}
                              assignmentTitle={assignment.title}
                              subject="korean"
                            />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <div className="text-center space-y-2">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-lg text-muted-foreground">
                  등록된 국어 과제가 없습니다
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
