'use client'

import { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import MessageDeleteButton from '@/components/message-delete-button'
import { cn } from '@/lib/utils'

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

interface MessageThreadProps {
  messages: MessageWithSender[]
  currentUserId: string
}

export default function MessageThread({
  messages,
  currentUserId,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 메시지가 변경되면 자동으로 스크롤 하단으로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="p-4 space-y-4">
      {messages.map((message) => {
        const isMine = message.sender_id === currentUserId
        const isTeacher = message.sender.role === 'teacher'

        return (
          <div
            key={message.id}
            className={cn('flex gap-3', isMine ? 'justify-end' : 'justify-start')}
          >
            {!isMine && (
              <Avatar className="h-8 w-8 flex-none">
                {message.sender.avatar_url && (
                  <AvatarImage
                    src={message.sender.avatar_url}
                    alt={message.sender.name}
                  />
                )}
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                'flex flex-col gap-1 max-w-[70%]',
                isMine ? 'items-end' : 'items-start'
              )}
            >
              <div className="flex items-center gap-2">
                {!isMine && (
                  <>
                    <span className="text-sm font-medium">
                      {message.sender.name}
                    </span>
                    <Badge
                      variant={isTeacher ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {isTeacher ? '선생님' : '학생'}
                    </Badge>
                  </>
                )}
              </div>

              <div
                className={cn(
                  'rounded-lg px-4 py-2 break-words',
                  isMine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.created_at), 'M월 d일 HH:mm', {
                    locale: ko,
                  })}
                </span>
                {isMine && (
                  <>
                    {!message.is_read && (
                      <Badge variant="outline" className="text-xs">
                        안읽음
                      </Badge>
                    )}
                    <MessageDeleteButton
                      messageId={message.id}
                      messageContent={message.content}
                    />
                  </>
                )}
              </div>
            </div>

            {isMine && (
              <Avatar className="h-8 w-8 flex-none">
                {message.sender.avatar_url && (
                  <AvatarImage
                    src={message.sender.avatar_url}
                    alt={message.sender.name}
                  />
                )}
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
