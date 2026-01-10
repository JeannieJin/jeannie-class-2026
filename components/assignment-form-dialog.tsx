'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createAssignment, updateAssignment } from '@/app/actions/assignments'
import { Plus, Pencil } from 'lucide-react'

interface AssignmentFormDialogProps {
  subject: string
  mode?: 'create' | 'edit'
  assignment?: {
    id: string
    title: string
    description?: string
    due_date?: string
    total_points?: number
    external_url?: string
  }
  onSuccess?: () => void
}

export function AssignmentFormDialog({
  subject,
  mode = 'create',
  assignment,
  onSuccess,
}: AssignmentFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('subject', subject)

    let result
    if (mode === 'edit' && assignment) {
      result = await updateAssignment(assignment.id, formData)
    } else {
      result = await createAssignment(formData)
    }

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      if (onSuccess) {
        onSuccess()
      }
      // 폼 초기화
      e.currentTarget.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            과제 작성
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '새 과제 작성' : '과제 수정'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={assignment?.title}
              required
              placeholder="과제 제목을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={assignment?.description}
              placeholder="과제 설명을 입력하세요"
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalUrl">구글 링크 또는 외부 링크</Label>
            <Input
              id="externalUrl"
              name="externalUrl"
              type="url"
              defaultValue={assignment?.external_url}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">마감일</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                defaultValue={
                  assignment?.due_date
                    ? new Date(assignment.due_date).toISOString().slice(0, 16)
                    : ''
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPoints">배점</Label>
              <Input
                id="totalPoints"
                name="totalPoints"
                type="number"
                min="0"
                defaultValue={assignment?.total_points}
                placeholder="점수"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : mode === 'create' ? '작성' : '수정'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
