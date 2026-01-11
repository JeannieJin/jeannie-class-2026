'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { format, addWeeks, startOfWeek, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

const DAYS = ['월요일', '화요일', '수요일', '목요일', '금요일']
const PERIODS = [1, 2, 3, 4, 5, 6]

interface TimetableCell {
  id?: string
  day_of_week: number
  period: number
  subject: string
  is_holiday: boolean
}

export default function TimetablePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // 이번 주 월요일
    return startOfWeek(new Date(), { weekStartsOn: 1 })
  })

  const [timetable, setTimetable] = useState<TimetableCell[]>([])
  const [isTeacher, setIsTeacher] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const supabase: any = createClient()

  // 주간 끝 날짜 계산 (금요일)
  const weekEnd = addDays(currentWeekStart, 4)
  const weekRangeText = `${format(currentWeekStart, 'yyyy.M.d')} ~ ${format(weekEnd, 'M.d')}`

  // 사용자 권한 확인
  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = (await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single())
        setIsTeacher(profile?.role === 'teacher')
      }
    }
    checkRole()
  }, [])

  // 시간표 데이터 로드
  useEffect(() => {
    loadTimetable()
  }, [currentWeekStart])

  async function loadTimetable() {
    setIsLoading(true)
    try {
      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('timetable')
        .select('*')
        .eq('week_start_date', weekStartStr)

      if (error) throw error

      // 기존 데이터가 있으면 사용, 없으면 빈 템플릿 생성
      if (data && data.length > 0) {
        setTimetable(data.map((item: any) => ({
          id: item.id,
          day_of_week: item.day_of_week,
          period: item.period,
          subject: item.subject || '',
          is_holiday: item.is_holiday || false,
        })))
      } else {
        // 빈 템플릿 생성
        const emptyTemplate: TimetableCell[] = []
        for (let day = 1; day <= 5; day++) {
          for (let period = 1; period <= 6; period++) {
            emptyTemplate.push({
              day_of_week: day,
              period,
              subject: '',
              is_holiday: false,
            })
          }
        }
        setTimetable(emptyTemplate)
      }
    } catch (error) {
      console.error('시간표 로드 실패:', error)
      toast.error('시간표를 불러오는 데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 이전 주
  function handlePrevWeek() {
    setCurrentWeekStart(addWeeks(currentWeekStart, -1))
  }

  // 다음 주
  function handleNextWeek() {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  // 셀 값 업데이트
  function updateCell(day: number, period: number, field: 'subject' | 'is_holiday', value: string | boolean) {
    setTimetable(prev => prev.map(cell => {
      if (cell.day_of_week === day && cell.period === period) {
        return { ...cell, [field]: value }
      }
      return cell
    }))
  }

  // 휴일 체크 시 해당 요일 전체 처리
  function toggleHoliday(day: number) {
    const isCurrentlyHoliday = timetable.find(c => c.day_of_week === day && c.period === 1)?.is_holiday || false

    setTimetable(prev => prev.map(cell => {
      if (cell.day_of_week === day) {
        return {
          ...cell,
          is_holiday: !isCurrentlyHoliday,
          subject: !isCurrentlyHoliday ? '' : cell.subject // 휴일로 체크하면 과목 초기화
        }
      }
      return cell
    }))
  }

  // 저장
  async function handleSave() {
    if (!isTeacher) {
      toast.error('교사만 시간표를 수정할 수 있습니다')
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd')

      // 기존 데이터 삭제
      await supabase
        .from('timetable')
        .delete()
        .eq('week_start_date', weekStartStr)

      // 새 데이터 삽입
      const insertData = timetable.map(cell => ({
        week_start_date: weekStartStr,
        day_of_week: cell.day_of_week,
        period: cell.period,
        subject: cell.subject || null,
        is_holiday: cell.is_holiday,
        created_by: user.id,
      }))

      const { error } = await supabase
        .from('timetable')
        .insert(insertData as any)

      if (error) throw error

      toast.success('시간표가 저장되었습니다')
      await loadTimetable() // 다시 로드
    } catch (error: any) {
      console.error('시간표 저장 실패:', error)
      toast.error('시간표 저장에 실패했습니다: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // 특정 셀 가져오기
  function getCell(day: number, period: number): TimetableCell {
    return timetable.find(c => c.day_of_week === day && c.period === period) || {
      day_of_week: day,
      period,
      subject: '',
      is_holiday: false,
    }
  }

  // 특정 요일이 휴일인지 확인
  function isDayHoliday(day: number): boolean {
    return timetable.find(c => c.day_of_week === day && c.period === 1)?.is_holiday || false
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">시간표를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">시간표</h1>
          <span className="text-lg text-muted-foreground">({weekRangeText})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            이번 주
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {isTeacher && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="ml-2"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          )}
        </div>
      </div>

      {/* 시간표 그리드 */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-3 bg-muted text-center w-20">교시</th>
                  {DAYS.map((day, idx) => {
                    const dayDate = addDays(currentWeekStart, idx)
                    const dateStr = format(dayDate, 'M/d')
                    const isHoliday = isDayHoliday(idx + 1)

                    return (
                      <th key={day} className="border p-3 bg-muted">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{day}</span>
                            <span className="text-sm text-muted-foreground">({dateStr})</span>
                          </div>
                          {isTeacher && (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`holiday-${idx}`}
                                checked={isHoliday}
                                onCheckedChange={() => toggleHoliday(idx + 1)}
                              />
                              <label
                                htmlFor={`holiday-${idx}`}
                                className="text-xs cursor-pointer"
                              >
                                휴일
                              </label>
                            </div>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(period => (
                  <tr key={period}>
                    <td className="border p-3 text-center font-semibold bg-muted">
                      {period}교시
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const day = dayIdx + 1
                      const cell = getCell(day, period)
                      const isHoliday = cell.is_holiday

                      return (
                        <td key={`${day}-${period}`} className="border p-2">
                          {isHoliday ? (
                            <div className="flex items-center justify-center h-12 text-sm text-muted-foreground">
                              휴일
                            </div>
                          ) : isTeacher ? (
                            <Input
                              value={cell.subject}
                              onChange={(e) => updateCell(day, period, 'subject', e.target.value)}
                              placeholder="과목명"
                              className="text-center"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-12 font-medium">
                              {cell.subject || '-'}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!isTeacher && (
        <p className="text-sm text-muted-foreground text-center">
          교사만 시간표를 수정할 수 있습니다
        </p>
      )}
    </div>
  )
}
