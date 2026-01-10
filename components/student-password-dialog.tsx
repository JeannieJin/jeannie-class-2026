'use client'

import { useState } from 'react'
import { updateStudentPassword } from '@/app/actions/students'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function StudentPasswordDialog({
  studentId,
  studentName,
}: {
  studentId: string
  studentName: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateStudentPassword(studentId, newPassword)

      toast({
        title: '비밀번호 변경 완료',
        description: `${studentName} 학생의 비밀번호가 변경되었습니다.`,
      })

      setNewPassword('')
      setOpen(false)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '비밀번호 변경 실패',
        description: error.message || '비밀번호 변경에 실패했습니다.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="h-4 w-4 mr-1" />
          비밀번호 변경
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
            <DialogDescription>
              {studentName} 학생의 새 비밀번호를 입력하세요
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="최소 6자 이상"
                required
                minLength={6}
                autoComplete="off"
              />
              <p className="text-sm text-muted-foreground">
                변경된 비밀번호를 학생에게 안전하게 전달해주세요
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '변경 중...' : '변경'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
