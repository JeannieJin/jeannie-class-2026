'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteMessage } from '@/app/actions/messages'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface MessageDeleteButtonProps {
  messageId: string
  messageContent: string
}

export default function MessageDeleteButton({
  messageId,
  messageContent,
}: MessageDeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    const result = await deleteMessage(messageId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('메시지를 삭제했습니다.')
      router.refresh()
    }

    setLoading(false)
  }

  // 메시지 미리보기 (최대 30자)
  const preview =
    messageContent.length > 30
      ? messageContent.substring(0, 30) + '...'
      : messageContent

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={loading}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>메시지를 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{preview}&quot; 메시지를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
