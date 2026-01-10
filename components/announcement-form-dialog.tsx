'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createAnnouncement, updateAnnouncement } from '@/app/actions/announcements'
import { Plus, Pencil } from 'lucide-react'

interface AnnouncementFormDialogProps {
  mode?: 'create' | 'edit'
  announcement?: {
    id: string
    title: string
    content: string
    priority: 'high' | 'medium' | 'low'
    is_pinned: boolean
  }
  onSuccess?: () => void
}

export function AnnouncementFormDialog({
  mode = 'create',
  announcement,
  onSuccess,
}: AnnouncementFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [priority, setPriority] = useState(announcement?.priority || 'medium')
  const [isPinned, setIsPinned] = useState(announcement?.is_pinned || false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('priority', priority)
    formData.set('isPinned', isPinned.toString())

    let result
    if (mode === 'edit' && announcement) {
      result = await updateAnnouncement(announcement.id, formData)
    } else {
      result = await createAnnouncement(formData)
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
      setPriority('medium')
      setIsPinned(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            전달사항 작성
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
            {mode === 'create' ? '새 전달사항 작성' : '전달사항 수정'}
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
              defaultValue={announcement?.title}
              required
              placeholder="전달사항 제목을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              name="content"
              defaultValue={announcement?.content}
              required
              placeholder="전달사항 내용을 입력하세요"
              rows={8}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as 'high' | 'medium' | 'low')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">중요</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>옵션</Label>
              <div className="flex items-center space-x-2 h-10">
                <Checkbox
                  id="isPinned"
                  checked={isPinned}
                  onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                />
                <label
                  htmlFor="isPinned"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  상단 고정
                </label>
              </div>
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
