'use client'

import { useEffect } from 'react'
import { markMessagesAsRead } from '@/app/actions/messages'

interface AutoMarkReadProps {
  partnerId: string
}

export default function AutoMarkRead({ partnerId }: AutoMarkReadProps) {
  useEffect(() => {
    // 페이지 로드 시 자동으로 읽음 처리
    const markAsRead = async () => {
      await markMessagesAsRead(partnerId)
    }

    markAsRead()
  }, [partnerId])

  return null // UI를 렌더링하지 않음
}
