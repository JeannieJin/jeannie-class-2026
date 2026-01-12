import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/auth'
import { Card, CardContent } from '@/components/ui/card'
import { AssignmentFormDialog } from '@/components/assignment-form-dialog'
import { AssignmentTableRow } from '@/components/assignment-table-row'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BookOpen } from 'lucide-react'

export default async function KoreanAssignmentsPage() {
  const user: any = await getCurrentUser()
  const supabase = await createClient()

  // 국어 과제 가져오기
  const { data: assignments } = (await supabase
    .from('assignments')
    .select('*')
    .eq('subject', 'korean')
    .order('created_at', { ascending: false })) as any

  // 학생인 경우 제출 현황 가져오기
  let submissionMap: Record<string, boolean> = {}
  let totalSubmitted = 0

  if (user?.role === 'student' && assignments && assignments.length > 0) {
    const { data: submissions } = (await supabase
      .from('submissions')
      .select('assignment_id')
      .eq('student_id', user.id)
      .in(
        'assignment_id',
        assignments.map((a: any) => a.id)
      )) as any

    if (submissions) {
      submissions.forEach((s: any) => {
        submissionMap[s.assignment_id] = true
      })
      totalSubmitted = submissions.length
    }
  }

  // 디버깅: 현재 사용자 역할 확인
  console.log('Korean Page - User:', user)
  console.log('Korean Page - User Role:', user?.role)

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
                {user?.role === 'student'
                  ? `국어 과제 목록 및 제출 현황 (총 과제: ${assignments?.length || 0}, 제출완료: ${totalSubmitted}) [역할: ${user?.role}]`
                  : `국어 과제 목록 및 제출 현황 [역할: ${user?.role || '알 수 없음'}]`}
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
                  <TableHead className="w-12">번호</TableHead>
                  <TableHead className="w-48">제목</TableHead>
                  <TableHead>내용</TableHead>
                  <TableHead className="w-32">마감일</TableHead>
                  <TableHead className="w-28">작성일</TableHead>
                  {user?.role === 'teacher' && (
                    <TableHead className="w-28 text-center">제출 명단</TableHead>
                  )}
                  {user?.role === 'student' && (
                    <TableHead className="w-32 text-center">제출</TableHead>
                  )}
                  {user?.role === 'teacher' && (
                    <TableHead className="w-24 text-center">작업</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment: any, index: number) => {
                  const isSubmitted = submissionMap[assignment.id] || false

                  return (
                    <AssignmentTableRow
                      key={assignment.id}
                      assignment={assignment}
                      index={index}
                      totalCount={assignments.length}
                      isSubmitted={isSubmitted}
                      userRole={user?.role}
                    />
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
