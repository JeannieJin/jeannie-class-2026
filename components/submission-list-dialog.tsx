'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Users, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

interface SubmissionListDialogProps {
  assignmentId: string
  assignmentTitle: string
}

export function SubmissionListDialog({ assignmentId, assignmentTitle }: SubmissionListDialogProps) {
  const [open, setOpen] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadSubmissions()
    }
  }, [open])

  const loadSubmissions = async () => {
    setLoading(true)
    const supabase = createClient()

    // 제출한 학생 정보 가져오기
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        submitted_at,
        student:users!submissions_student_id_fkey (
          id,
          name,
          student_number
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })

    if (!error && data) {
      setSubmissions(data)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Users className="h-4 w-4" />
          <span className="text-xs">제출 명단</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>제출 명단</DialogTitle>
          <p className="text-sm text-muted-foreground">{assignmentTitle}</p>
        </DialogHeader>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              로딩 중...
            </div>
          ) : submissions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default" className="bg-green-500">
                  총 {submissions.length}명 제출
                </Badge>
              </div>
              {submissions.map((submission: any) => (
                <div
                  key={submission.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{submission.student?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {submission.student?.student_number}번
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(submission.submitted_at).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                아직 제출한 학생이 없습니다
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
