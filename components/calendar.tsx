'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'

type Event = Database['public']['Tables']['events']['Row']

interface CalendarProps {
  events: Event[]
  onDateClick: (date: string) => void
  onMonthChange?: (year: number, month: number) => void
  selectedDate?: string
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
]

export function Calendar({ events, onDateClick, onMonthChange, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 해당 월의 첫날과 마지막날
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 달력에 표시할 날짜들 계산
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay()) // 일요일부터 시작

  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())) // 토요일까지

  // 날짜 배열 생성
  const dates: Date[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  // 주 단위로 그룹화
  const weeks: Date[][] = []
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7))
  }

  // 특정 날짜에 일정이 있는지 확인
  const hasEvent = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.some((event) => event.event_date === dateString)
  }

  // 특정 날짜의 공휴일 정보 가져오기
  const getHoliday = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.find(
      (event) => event.event_date === dateString && event.event_type === 'holiday'
    )
  }

  // 특정 날짜에 공휴일이 아닌 일정 가져오기
  const getNonHolidayEvents = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.filter(
      (event) =>
        event.event_date === dateString && event.event_type !== 'holiday'
    )
  }

  // 오늘 날짜인지 확인
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // 현재 월인지 확인
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month
  }

  // 선택된 날짜인지 확인
  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    const dateString = date.toISOString().split('T')[0]
    return dateString === selectedDate
  }

  // 이전 달로 이동
  const goToPrevMonth = () => {
    const newDate = new Date(year, month - 1, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1)
  }

  // 다음 달로 이동
  const goToNextMonth = () => {
    const newDate = new Date(year, month + 1, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1)
  }

  // 오늘로 이동
  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onMonthChange?.(today.getFullYear(), today.getMonth() + 1)
  }

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 text-xl font-semibold">
            {year}년 {MONTHS[month]}
          </h2>
        </div>
        <Button variant="outline" onClick={goToToday}>
          오늘
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {DAYS.map((day, index) => (
          <div
            key={day}
            className={cn(
              'py-2 text-center text-sm font-medium',
              index === 0 && 'text-red-500',
              index === 6 && 'text-blue-500'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((date, dateIndex) => {
              const dateString = date.toISOString().split('T')[0]
              const holiday = getHoliday(date)
              const nonHolidayEvents = getNonHolidayEvents(date)

              return (
                <button
                  key={dateString}
                  onClick={() => onDateClick(dateString)}
                  className={cn(
                    'relative min-h-[80px] rounded-lg border p-2 text-left transition-colors',
                    'hover:bg-accent',
                    !isCurrentMonth(date) && 'text-muted-foreground',
                    isToday(date) && 'border-primary bg-primary/5',
                    isSelected(date) && 'border-primary bg-primary/10',
                    // 공휴일일 때 빨간색 테두리
                    holiday && isCurrentMonth(date) && 'border-red-500 text-red-500',
                    // 공휴일이 아닐 때 요일별 색상
                    !holiday &&
                      dateIndex === 0 &&
                      isCurrentMonth(date) &&
                      'text-red-500',
                    !holiday &&
                      dateIndex === 6 &&
                      isCurrentMonth(date) &&
                      'text-blue-500'
                  )}
                >
                  <div className="text-sm font-medium">{date.getDate()}</div>

                  {/* 공휴일 표시 */}
                  {holiday && (
                    <>
                      <div className="mt-1 text-[10px] font-medium text-red-500 line-clamp-2">
                        {holiday.title}
                      </div>
                      <div className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-red-500" />
                    </>
                  )}

                  {/* 일반 기념일 표시 */}
                  {!holiday && nonHolidayEvents.length > 0 && (
                    <>
                      <div className="mt-1 text-[10px] font-medium text-green-600 line-clamp-2">
                        {nonHolidayEvents[0].title}
                      </div>
                      <div className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-green-600" />
                    </>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
