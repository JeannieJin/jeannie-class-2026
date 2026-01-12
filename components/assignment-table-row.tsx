'use client'

import { useState } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { AssignmentDetailDialog } from '@/components/assignment-detail-dialog'
import { AssignmentFormDialog } from '@/components/assignment-form-dialog'
import { AssignmentDeleteButton } from '@/components/assignment-delete-button'
import { SubmissionListDialog } from '@/components/submission-list-dialog'
import { AssignmentSubmitButton } from '@/components/assignment-submit-button'
import { ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Assignment {
  id: string
  title: string
  description: string | null
  subject: string
  due_date: string | null
  external_url: string | null
  created_at: string
}

interface AssignmentTableRowProps {
  assignment: Assignment
  index: number
  totalCount: number
  isSubmitted?: boolean
  userRole?: 'teacher' | 'student'
}

export function AssignmentTableRow({
  assignment,
  index,
  totalCount,
  isSubmitted = false,
  userRole,
}: AssignmentTableRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <TableRow
        className="hover:bg-muted/50 cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
          {/* 번호 */}
          <TableCell className="w-12 font-medium text-muted-foreground">
            {totalCount - index}
          </TableCell>

          {/* 제목 */}
          <TableCell className="w-48">
            <div className="space-y-1">
              <div className="font-semibold">{assignment.title}</div>
              {assignment.external_url && (
                <div className="inline-flex items-center gap-1 text-xs text-primary">
                  <ExternalLink className="h-3 w-3" />
                  링크
                </div>
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
          <TableCell className="w-32">
            {assignment.due_date ? (
              <div className="text-sm">
                {format(new Date(assignment.due_date), 'yy.MM.dd HH:mm', { locale: ko })}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </TableCell>

          {/* 작성일 */}
          <TableCell className="w-28">
            <div className="text-sm text-muted-foreground">
              {format(new Date(assignment.created_at), 'yy.MM.dd', { locale: ko })}
            </div>
          </TableCell>

          {/* 교사: 제출 명단 */}
          {userRole === 'teacher' && (
            <TableCell className="w-28 text-center" onClick={(e) => e.stopPropagation()}>
              <SubmissionListDialog
                assignmentId={assignment.id}
                assignmentTitle={assignment.title}
              />
            </TableCell>
          )}

          {/* 학생: 제출 */}
          {userRole === 'student' && (
            <TableCell className="w-32 text-center" onClick={(e) => e.stopPropagation()}>
              <AssignmentSubmitButton
                assignmentId={assignment.id}
                assignmentTitle={assignment.title}
                isSubmitted={isSubmitted}
              />
            </TableCell>
          )}

          {/* 교사: 작업 버튼 */}
          {userRole === 'teacher' && (
            <TableCell className="w-24" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center gap-1">
                <AssignmentFormDialog
                  subject={assignment.subject}
                  mode="edit"
                  assignment={assignment}
                />
                <AssignmentDeleteButton
                  assignmentId={assignment.id}
                  assignmentTitle={assignment.title}
                  subject={assignment.subject}
                />
              </div>
            </TableCell>
          )}
      </TableRow>

      <AssignmentDetailDialog
        assignment={assignment}
        isSubmitted={isSubmitted}
        userRole={userRole}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
