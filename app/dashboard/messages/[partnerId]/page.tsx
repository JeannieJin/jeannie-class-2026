import { getMessages } from '@/app/actions/messages'
import { getCurrentUser } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import MessageThread from '@/components/message-thread'
import MessageInput from '@/components/message-input'
import AutoMarkRead from '@/components/auto-mark-read'

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ partnerId: string }>
}) {
  const { partnerId } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // 대화 상대 정보 조회
  const { data: partner, error: partnerError } = await supabase
    .from('users')
    .select('id, name, role, avatar_url')
    .eq('id', partnerId)
    .single<{ id: string; name: string; role: 'teacher' | 'student'; avatar_url: string | null }>()

  if (partnerError || !partner) {
    notFound()
  }

  // 메시지 내역 조회
  const result = await getMessages(partnerId)
  const messages = (result.data || []) as any[]

  return (
    <div className="space-y-6">
      {/* 자동 읽음 처리 */}
      <AutoMarkRead partnerId={partnerId} />

      <div className="flex items-center gap-4">
        <Link href="/dashboard/messages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{partner.name}</h1>
          <Badge variant={partner.role === 'teacher' ? 'default' : 'secondary'}>
            {partner.role === 'teacher' ? '선생님' : '학생'}
          </Badge>
        </div>
      </div>

      <Card className="flex flex-col h-[calc(100vh-250px)]">
        <CardHeader className="flex-none border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            대화 내역
          </CardTitle>
          <CardDescription>
            {partner.name}님과의 대화입니다
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">아직 메시지가 없습니다</p>
                <p className="text-sm mt-2">첫 메시지를 보내보세요</p>
              </div>
            ) : (
              <MessageThread messages={messages} currentUserId={user.id} />
            )}
          </div>

          <div className="flex-none border-t p-4">
            <MessageInput partnerId={partnerId} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
