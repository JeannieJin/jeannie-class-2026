'use client'

import { useState, FormEvent, KeyboardEvent } from 'react'
import { sendMessage } from '@/app/actions/messages'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MessageInputProps {
  partnerId: string
}

export default function MessageInput({ partnerId }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!content.trim() || loading) {
      return
    }

    setLoading(true)

    const result = await sendMessage(partnerId, content.trim())

    if (result.error) {
      toast.error(result.error)
    } else {
      setContent('')
      router.refresh()
    }

    setLoading(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter만 누르면 전송, Shift+Enter는 줄바꿈
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
        className="resize-none min-h-[60px] max-h-[120px]"
        disabled={loading}
      />
      <Button
        type="submit"
        size="icon"
        disabled={loading || !content.trim()}
        className="flex-none"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}
