'use client'

import { useState } from 'react'
import { addStudent } from '@/app/actions/students'
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
import { UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function StudentAddDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    student_number: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addStudent({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        student_number: parseInt(formData.student_number),
      })

      toast({
        title: '학생 추가 완료',
        description: `${formData.name} 학생이 추가되었습니다.`,
      })

      // 폼 초기화 및 다이얼로그 닫기
      setFormData({
        email: '',
        password: '',
        name: '',
        student_number: '',
      })
      setOpen(false)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '학생 추가 실패',
        description: error.message || '학생을 추가하는데 실패했습니다.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          학생 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 학생 추가</DialogTitle>
            <DialogDescription>
              새로운 학생의 계정 정보를 입력하세요
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="student_number">번호</Label>
              <Input
                id="student_number"
                type="number"
                value={formData.student_number}
                onChange={(e) =>
                  setFormData({ ...formData, student_number: e.target.value })
                }
                placeholder="1"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">초기 비밀번호</Label>
              <Input
                id="password"
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="최소 6자 이상"
                required
                minLength={6}
              />
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
              {loading ? '추가 중...' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
