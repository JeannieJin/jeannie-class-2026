'use client'

import { useState, useEffect } from 'react'
import { sendMessage } from '@/app/actions/messages'
import type { Student } from '@/app/actions/students'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Send, Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface MessageWithSender {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  sender: {
    id: string
    name: string
    role: string
    avatar_url: string | null
  }
}

interface NewMessageDialogProps {
  students: Student[]
  currentUserId: string
}

export function NewMessageDialog({ students, currentUserId }: NewMessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [previousMessages, setPreviousMessages] = useState<MessageWithSender[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const router = useRouter()

  // 학생 선택 시 이전 메시지 내역 조회
  useEffect(() => {
    if (selectedStudentId) {
      loadPreviousMessages(selectedStudentId)
    } else {
      setPreviousMessages([])
    }
  }, [selectedStudentId])

  const loadPreviousMessages = async (studentId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/messages/${studentId}`)
      const data = await response.json()
      if (data.success) {
        setPreviousMessages(data.data || [])
      }
    } catch (error) {
      console.error('메시지 내역 조회 오류:', error)
    }
    setLoadingMessages(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStudentId) {
      toast.error('학생을 선택해주세요.')
      return
    }

    if (!content.trim()) {
      toast.error('메시지 내용을 입력하세요.')
      return
    }

    setLoading(true)

    const result = await sendMessage(selectedStudentId, content.trim())

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('메시지를 전송했습니다.')
      setContent('')
      setOpen(false)
      router.refresh()
    }

    setLoading(false)
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          새 메시지
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>새 메시지 보내기</DialogTitle>
          <DialogDescription>학생을 선택하고 메시지를 작성하세요</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* 학생 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">받는 사람</label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="학생을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.student_number}. {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 이전 메시지 내역 */}
          {selectedStudentId && (
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="flex-none pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {selectedStudent?.name}님과의 이전 대화
                </CardTitle>
                <CardDescription className="text-xs">
                  {previousMessages.length > 0
                    ? `${previousMessages.length}개의 메시지`
                    : '아직 대화가 없습니다'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[200px] px-4 pb-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      불러오는 중...
                    </div>
                  ) : previousMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      첫 번째 메시지를 보내보세요
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {previousMessages.map((message) => {
                        const isMine = message.sender_id === currentUserId
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isMine && (
                              <Avatar className="h-6 w-6 flex-none">
                                {message.sender.avatar_url && (
                                  <AvatarImage
                                    src={message.sender.avatar_url}
                                    alt={message.sender.name}
                                  />
                                )}
                                <AvatarFallback>
                                  <User className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex flex-col gap-1 max-w-[70%]">
                              <div
                                className={`rounded-lg px-3 py-2 text-sm ${
                                  isMine
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                {message.content}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.created_at), 'M/d HH:mm', {
                                  locale: ko,
                                })}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* 메시지 작성 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">메시지</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="min-h-[100px] resize-none"
              disabled={loading || !selectedStudentId}
            />
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
            <Button type="submit" disabled={loading || !selectedStudentId || !content.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  전송
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
