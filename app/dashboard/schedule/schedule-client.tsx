'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/calendar'
import { EventList } from '@/components/event-list'
import { EventDialog } from '@/components/event-dialog'
import { getEventsByMonth, getEventsByDate } from '@/app/actions/events'
import type { Database } from '@/lib/supabase/types'

type Event = Database['public']['Tables']['events']['Row']

interface ScheduleClientProps {
  initialEvents: Event[]
  userRole: 'teacher' | 'student'
}

export function ScheduleClient({
  initialEvents,
  userRole,
}: ScheduleClientProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [dateEvents, setDateEvents] = useState<Event[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  // 월이 바뀔 때마다 일정 새로고침
  const handleMonthChange = async (year: number, month: number) => {
    const result = await getEventsByMonth(year, month)
    if (result.data) {
      setEvents(result.data)
    }
  }

  // 날짜 클릭 핸들러 - 바로 일정 추가 다이얼로그 열기
  const handleDateClick = async (date: string, openDialog = true) => {
    setSelectedDate(date)

    // 해당 날짜의 일정 목록 가져오기
    const result = await getEventsByDate(date)
    if (result.data) {
      setDateEvents(result.data)
    } else {
      setDateEvents([])
    }

    // 교사인 경우 바로 일정 추가 다이얼로그 열기 (openDialog가 true일 때만)
    if (userRole === 'teacher' && openDialog) {
      setEditingEvent(null)
      setDialogOpen(true)
    }
  }

  // 일정 수정 다이얼로그 열기
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setDialogOpen(true)
  }

  // 일정 추가/수정 후 새로고침
  const handleEventSuccess = async () => {
    // 현재 월의 일정 새로고침
    const today = new Date()
    const result = await getEventsByMonth(
      today.getFullYear(),
      today.getMonth() + 1
    )
    if (result.data) {
      setEvents(result.data)
    }

    // 선택된 날짜의 일정 새로고침
    if (selectedDate) {
      const dateResult = await getEventsByDate(selectedDate)
      if (dateResult.data) {
        setDateEvents(dateResult.data)
      }
    }
  }

  // 초기 오늘 날짜 선택 (다이얼로그는 열지 않음)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    handleDateClick(today, false)
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
      {/* 캘린더 */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">학급 일정</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === 'teacher'
              ? '날짜를 클릭하여 일정을 추가하세요'
              : '날짜를 클릭하여 일정을 확인하세요'
            }
          </p>
        </div>
        <Calendar
          events={events}
          onDateClick={handleDateClick}
          onMonthChange={handleMonthChange}
          selectedDate={selectedDate}
        />
      </div>

      {/* 선택된 날짜의 일정 목록 */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        {selectedDate && (
          <EventList
            date={selectedDate}
            events={dateEvents}
            onEdit={handleEditEvent}
            onRefresh={handleEventSuccess}
            userRole={userRole}
          />
        )}
      </div>

      {/* 일정 추가/수정 다이얼로그 */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        event={editingEvent}
        onSuccess={handleEventSuccess}
      />
    </div>
  )
}
