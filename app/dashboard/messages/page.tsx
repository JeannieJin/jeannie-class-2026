import { getConversationList } from '@/app/actions/messages'
import { getCurrentUser } from '@/app/actions/auth'
import { getAllStudents } from '@/app/actions/students'
import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ConversationList from '@/components/conversation-list'
import { NewMessageDialog } from '@/components/new-message-dialog'

export default async function MessagesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getConversationList()
  const conversations = result.data || []

  // 교사인 경우 학생 목록 조회
  const students = user.role === 'teacher' ? await getAllStudents() : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-3xl font-bold">메시지</h1>
        </div>
        {user.role === 'teacher' && students.length > 0 && (
          <NewMessageDialog students={students} currentUserId={user.id} />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>대화 목록</CardTitle>
          <CardDescription>
            {user.role === 'teacher'
              ? '학생들과의 대화를 관리하세요'
              : '선생님과의 대화를 확인하세요'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">아직 대화가 없습니다</p>
              <p className="text-sm mt-2">
                {user.role === 'teacher'
                  ? '학생들에게 메시지를 보내보세요'
                  : '선생님께 메시지를 보내보세요'}
              </p>
            </div>
          ) : (
            <ConversationList conversations={conversations} currentUserId={user.id} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
