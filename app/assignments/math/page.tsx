import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/auth'
import { Card, CardContent } from '@/components/ui/card'
import { AssignmentFormDialog } from '@/components/assignment-form-dialog'
import { AssignmentDeleteButton } from '@/components/assignment-delete-button'
import { SubmissionListDialog } from '@/components/submission-list-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calculator, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

export default async function MathAssignmentsPage() {
  const user: any = await getCurrentUser()
  const supabase = await createClient()

  // 수학 과제 가져오기
  const { data: assignments } = (await supabase
    .from('assignments')
    .select('*')
    .eq('subject', 'math')
    .order('created_at', { ascending: false })) as any

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Calculator className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">수학 과제</h1>
              <p className="text-lg text-muted-foreground">
                수학 과제 목록 및 제출 현황
              </p>
            </div>
          </div>
          {user?.role === 'teacher' && (
            <AssignmentFormDialog subject="math" />
          )}
        </div>
      </div>

      {/* 과제 목록 테이블 (교사용) */}
      <Card>
        <CardContent className="p-0">
          {assignments && assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">번호</TableHead>
                  <TableHead className="w-48">제목</TableHead>
                  <TableHead>내용</TableHead>
                  <TableHead className="w-32">마감일</TableHead>
                  <TableHead className="w-28">작성일</TableHead>
                  <TableHead className="w-28 text-center">제출 명단</TableHead>
                  <TableHead className="w-24 text-center">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment: any, index: number) => {
                  return (
                    <TableRow key={assignment.id} className="hover:bg-muted/50">
                      {/* 번호 */}
                      <TableCell className="font-medium text-muted-foreground">
                        {assignments.length - index}
                      </TableCell>

                      {/* 제목 */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold">{assignment.title}</div>
                          {assignment.external_url && (
                            <Link
                              href={assignment.external_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              링크
                            </Link>
                          )}
                        </div>
                      </TableCell>

                      {/* 내용 */}
                      <TableCell>
                        {assignment.description ? (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {assignment.description}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      {/* 마감일 */}
                      <TableCell>
                        {assignment.due_date ? (
                          <div className="text-sm">
                            {format(new Date(assignment.due_date), 'yy.MM.dd HH:mm', { locale: ko })}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      {/* 작성일 */}
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(assignment.created_at), 'yy.MM.dd', { locale: ko })}
                        </div>
                      </TableCell>

                      {/* 제출 명단 */}
                      <TableCell className="text-center">
                        <SubmissionListDialog
                          assignmentId={assignment.id}
                          assignmentTitle={assignment.title}
                        />
                      </TableCell>

                      {/* 작업 버튼 */}
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <AssignmentFormDialog
                            subject="math"
                            mode="edit"
                            assignment={assignment}
                          />
                          <AssignmentDeleteButton
                            assignmentId={assignment.id}
                            assignmentTitle={assignment.title}
                            subject="math"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <div className="text-center space-y-2">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-lg text-muted-foreground">
                  등록된 수학 과제가 없습니다
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
