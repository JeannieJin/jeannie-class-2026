'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ConversationPartner {
  partner: {
    id: string
    name: string
    role: string
    avatar_url: string | null
  }
  lastMessage?: {
    id: string
    sender_id: string
    content: string
    created_at: string
  }
  unreadCount: number
}

interface ConversationListProps {
  conversations: ConversationPartner[]
  currentUserId: string
}

export default function ConversationList({
  conversations,
  currentUserId,
}: ConversationListProps) {
  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const { partner, lastMessage, unreadCount } = conversation
        const isSentByMe = lastMessage?.sender_id === currentUserId

        return (
          <Link
            key={partner.id}
            href={`/dashboard/messages/${partner.id}`}
            className="block"
          >
            <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-colors">
              <Avatar className="h-12 w-12">
                {partner.avatar_url && (
                  <AvatarImage src={partner.avatar_url} alt={partner.name} />
                )}
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{partner.name}</h3>
                  <Badge
                    variant={partner.role === 'teacher' ? 'default' : 'secondary'}
                    className="flex-none"
                  >
                    {partner.role === 'teacher' ? '선생님' : '학생'}
                  </Badge>
                </div>

                {lastMessage && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      {isSentByMe && '나: '}
                      {lastMessage.content}
                    </p>
                    <span className="text-xs text-muted-foreground flex-none">
                      {formatDistanceToNow(new Date(lastMessage.created_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                )}
              </div>

              {unreadCount > 0 && (
                <Badge variant="destructive" className="flex-none">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
