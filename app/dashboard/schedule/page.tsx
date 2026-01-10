import { ScheduleClient } from './schedule-client'
import { getEventsByMonth } from '@/app/actions/events'
import { getCurrentUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'

export default async function SchedulePage() {
  // 사용자 정보 가져오기
  const user = (await getCurrentUser()) as any

  if (!user) {
    redirect('/login')
  }

  // 현재 월의 일정 가져오기
  const today = new Date()
  const { data: events } = await getEventsByMonth(
    today.getFullYear(),
    today.getMonth() + 1
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">일정 관리</h1>
        <p className="text-muted-foreground">
          학급 일정과 중요한 행사를 관리하고 확인하세요
        </p>
      </div>

      <ScheduleClient
        initialEvents={events || []}
        userRole={user.role as 'teacher' | 'student'}
      />
    </div>
  )
}
