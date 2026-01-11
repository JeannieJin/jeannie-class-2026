'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'

type MessageInsert = Database['public']['Tables']['messages']['Insert']
type User = Database['public']['Tables']['users']['Row']
type Message = Database['public']['Tables']['messages']['Row']

// 메시지 전송
export async function sendMessage(receiverId: string, content: string) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  // 내용 검증
  if (!content || !content.trim()) {
    return { error: '메시지 내용을 입력하세요.' }
  }

  // 수신자 확인
  const { data: receiver, error: receiverError } = await (supabase
    .from('users') as any)
    .select('id, role')
    .eq('id', receiverId)
    .single()

  if (receiverError || !receiver) {
    return { error: '사용자를 찾을 수 없습니다.' }
  }

  // 학생인 경우 교사에게만 메시지 전송 가능
  if (user.role === 'student' && receiver.role !== 'teacher') {
    return { error: '교사에게만 메시지를 보낼 수 있습니다.' }
  }

  const messageData: MessageInsert = {
    sender_id: user.id,
    receiver_id: receiverId,
    content: content.trim(),
  }

  const { data, error } = await (supabase
    .from('messages') as any)
    .insert(messageData)
    .select()
    .single()

  if (error) {
    console.error('메시지 전송 오류:', error)
    return { error: '메시지 전송에 실패했습니다.' }
  }

  revalidatePath('/dashboard/messages')
  return { success: true, data }
}

// 대화 상대 목록 조회
export async function getConversationList() {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  try {
    // 현재 사용자가 관련된 모든 메시지 조회
    const { data: messages, error: messagesError } = await (supabase
      .from('messages') as any)
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (messagesError) {
      console.error('메시지 조회 오류:', messagesError)
      return { error: '메시지 조회에 실패했습니다.' }
    }

    if (!messages || messages.length === 0) {
      return { success: true, data: [] }
    }

    // 대화 상대 ID 추출 (중복 제거)
    const partnerIds = Array.from(
      new Set(
        messages.map((msg: Message) =>
          msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        )
      )
    )

    // 각 대화 상대에 대한 정보 조회
    const conversations = await Promise.all(
      partnerIds.map(async (partnerId) => {
        // 상대방 정보 조회
        const { data: partner } = await (supabase
          .from('users') as any)
          .select('id, name, role, avatar_url')
          .eq('id', partnerId)
          .single()

        if (!partner) return null

        // 해당 상대와의 메시지 중 최근 메시지 찾기
        const partnerMessages = messages.filter(
          (msg: Message) =>
            (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
            (msg.sender_id === partnerId && msg.receiver_id === user.id)
        )

        const lastMessage = partnerMessages[0]

        // 안읽은 메시지 개수 (상대방이 보낸 것 중 안읽은 것)
        const unreadCount = partnerMessages.filter(
          (msg: Message) => msg.sender_id === partnerId && !msg.is_read
        ).length

        return {
          partner,
          lastMessage,
          unreadCount,
        }
      })
    )

    // null 제거 및 최근 메시지 시간 순 정렬
    const validConversations = conversations
      .filter((conv) => conv !== null)
      .sort((a, b) => {
        const timeA = a?.lastMessage?.created_at || ''
        const timeB = b?.lastMessage?.created_at || ''
        return timeB.localeCompare(timeA)
      })

    return { success: true, data: validConversations }
  } catch (error) {
    console.error('대화 목록 조회 오류:', error)
    return { error: '대화 목록 조회에 실패했습니다.' }
  }
}

// 특정 상대와의 메시지 내역 조회
export async function getMessages(partnerId: string) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  try {
    // 양방향 메시지 조회
    const { data: messages, error: messagesError } = await (supabase
      .from('messages') as any)
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('메시지 조회 오류:', messagesError)
      return { error: '메시지 조회에 실패했습니다.' }
    }

    // 발신자 정보 추가
    const messagesWithSender = await Promise.all(
      (messages || []).map(async (message: Message) => {
        const { data: sender } = await (supabase
          .from('users') as any)
          .select('id, name, role, avatar_url')
          .eq('id', message.sender_id)
          .single()

        return {
          ...message,
          sender,
        }
      })
    )

    return { success: true, data: messagesWithSender }
  } catch (error) {
    console.error('메시지 내역 조회 오류:', error)
    return { error: '메시지 내역 조회에 실패했습니다.' }
  }
}

// 메시지 읽음 처리
export async function markMessagesAsRead(partnerId: string) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  // 상대방이 보낸 안읽은 메시지를 모두 읽음 처리
  const { error } = await (supabase
    .from('messages') as any)
    .update({ is_read: true })
    .eq('sender_id', partnerId)
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('읽음 처리 오류:', error)
    return { error: '읽음 처리에 실패했습니다.' }
  }

  revalidatePath('/dashboard/messages')
  return { success: true }
}

// 메시지 삭제
export async function deleteMessage(messageId: string) {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  // RLS 정책이 권한을 체크하므로 직접 삭제 시도
  const { error } = await (supabase
    .from('messages') as any)
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id)

  if (error) {
    console.error('메시지 삭제 오류:', error)
    return { error: '본인이 보낸 메시지만 삭제할 수 있습니다.' }
  }

  revalidatePath('/dashboard/messages')
  return { success: true }
}

// 안읽은 메시지 개수 조회
export async function getUnreadMessageCount() {
  const supabase = await createClient()
  const user = (await getCurrentUser()) as any

  if (!user) {
    return { error: '로그인이 필요합니다.', count: 0 }
  }

  const { count, error } = await (supabase
    .from('messages') as any)
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('안읽은 메시지 개수 조회 오류:', error)
    return { error: '안읽은 메시지 개수 조회에 실패했습니다.', count: 0 }
  }

  return { success: true, count: count || 0 }
}
