import { getAllStudents } from '@/app/actions/students'
import { getCurrentUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import { StudentAddDialog } from '@/components/student-add-dialog'
import { StudentPasswordDialog } from '@/components/student-password-dialog'
import { StudentDeleteButton } from '@/components/student-delete-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default async function StudentsPage() {
  const user = (await getCurrentUser()) as any

  // 교사만 접근 가능
  if (!user || user.role !== 'teacher') {
    redirect('/dashboard')
  }

  const students = await getAllStudents()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">학생 명단</h1>
          <p className="text-muted-foreground mt-2">학생 계정을 관리합니다</p>
        </div>
        <StudentAddDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            전체 학생 ({students.length}명)
          </CardTitle>
          <CardDescription>학생들의 계정 정보를 확인하고 관리할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              등록된 학생이 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>번호</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.student_number}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      {new Date(student.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <StudentPasswordDialog
                          studentId={student.id}
                          studentName={student.name}
                        />
                        <StudentDeleteButton
                          studentId={student.id}
                          studentName={student.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
