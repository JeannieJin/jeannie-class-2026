'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssignmentSubmitButton } from '@/components/assignment-submit-button'
import { Calendar, Clock, ExternalLink, FileText, Link as LinkIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { submitAssignment } from '@/app/actions/submissions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Assignment {
  id: string
  title: string
  description: string | null
  subject: string
  due_date: string | null
  external_url: string | null
  created_at: string
}

interface AssignmentDetailDialogProps {
  assignment: Assignment
  isSubmitted?: boolean
  userRole?: 'teacher' | 'student'
  open: boolean
  onOpenChange: (open: boolean) => void
}

const subjectLabels: Record<string, string> = {
  korean: '국어',
  math: '수학',
  social: '사회',
  science: '과학',
  english: '영어',
  other: '기타',
}

const subjectColors: Record<string, string> = {
  korean: 'bg-blue-500/10 text-blue-500',
  math: 'bg-red-500/10 text-red-500',
  social: 'bg-green-500/10 text-green-500',
  science: 'bg-purple-500/10 text-purple-500',
  english: 'bg-orange-500/10 text-orange-500',
  other: 'bg-gray-500/10 text-gray-500',
}

export function AssignmentDetailDialog({
  assignment,
  isSubmitted = false,
  userRole,
  open,
  onOpenChange,
}: AssignmentDetailDialogProps) {
  const router = useRouter()
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitWithUrl = async () => {
    if (!submissionUrl.trim()) {
      toast.error('제출 URL을 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitAssignment(assignment.id, submissionUrl)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('과제를 제출했습니다')
        setSubmissionUrl('')
        onOpenChange(false)
        router.refresh()
      }
    } catch (error) {
      toast.error('오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${subjectColors[assignment.subject]}`}>
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{assignment.title}</DialogTitle>
              <DialogDescription className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {subjectLabels[assignment.subject]}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 과제 내용 */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">과제 내용</h3>
            {assignment.description ? (
              <p className="text-base whitespace-pre-wrap leading-relaxed">
                {assignment.description}
              </p>
            ) : (
              <p className="text-muted-foreground">내용이 없습니다.</p>
            )}
          </div>

          {/* 외부 링크 */}
          {assignment.external_url && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">참고 링크</h3>
              <Link
                href={assignment.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {assignment.external_url}
              </Link>
            </div>
          )}

          {/* 마감일 */}
          <div className="grid grid-cols-2 gap-4">
            {assignment.due_date && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  마감일
                </h3>
                <p className="text-base">
                  {format(new Date(assignment.due_date), 'yyyy년 M월 d일 HH:mm', {
                    locale: ko,
                  })}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                작성일
              </h3>
              <p className="text-base">
                {format(new Date(assignment.created_at), 'yyyy년 M월 d일', {
                  locale: ko,
                })}
              </p>
            </div>
          </div>

          {/* 학생: 제출 영역 */}
          {userRole === 'student' && (
            <div className="pt-4 border-t space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">제출 상태</h3>
                <p className="text-sm text-muted-foreground">
                  {isSubmitted ? '제출 완료되었습니다' : '아직 제출하지 않았습니다'}
                </p>
              </div>

              {!isSubmitted && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="submission-url" className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      제출 URL
                    </Label>
                    <Input
                      id="submission-url"
                      type="url"
                      placeholder="https://..."
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      과제를 제출한 링크 주소를 입력하세요 (예: 구글 문서, 노션 페이지 등)
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmitWithUrl}
                    disabled={isSubmitting || !submissionUrl.trim()}
                    className="w-full"
                  >
                    {isSubmitting ? '제출 중...' : '과제 제출하기'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
