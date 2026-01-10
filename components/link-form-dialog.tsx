'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createLink, updateLink } from '@/app/actions/links'
import { Plus, Pencil } from 'lucide-react'

interface LinkFormDialogProps {
  mode?: 'create' | 'edit'
  link?: {
    id: string
    title: string
    url: string
    description?: string
    category?: string
  }
  onSuccess?: () => void
}

export function LinkFormDialog({
  mode = 'create',
  link,
  onSuccess,
}: LinkFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    let result
    if (mode === 'edit' && link) {
      result = await updateLink(link.id, formData)
    } else {
      result = await createLink(formData)
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
            추가하기
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
            {mode === 'create' ? '새 참고링크 추가' : '참고링크 수정'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">사이트 이름 *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={link?.title}
              required
              placeholder="예: 구글 클래스룸"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">사이트 주소 *</Label>
            <Input
              id="url"
              name="url"
              type="url"
              defaultValue={link?.url}
              required
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Input
              id="category"
              name="category"
              defaultValue={link?.category}
              placeholder="예: 학습, 과제, 자료 등"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">그외 내용</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={link?.description}
              placeholder="링크에 대한 설명을 입력하세요"
              rows={4}
            />
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
              {loading ? '저장 중...' : mode === 'create' ? '추가' : '수정'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
