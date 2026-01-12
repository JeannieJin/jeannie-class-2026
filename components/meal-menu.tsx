'use client'

import { useState, useEffect } from 'react'
import { getMealByDate, type MealInfo } from '@/app/actions/meal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Utensils, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 급식 메뉴를 표시하는 컴포넌트 (날짜 이동 기능 포함)
 */
export function MealMenu() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [mealData, setMealData] = useState<MealInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 날짜가 변경될 때마다 급식 정보 가져오기
  useEffect(() => {
    const fetchMeal = async () => {
      setIsLoading(true)
      setError(null)

      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const result = await getMealByDate(dateStr)

      if (!result.success) {
        setError(result.error || '급식 정보를 가져올 수 없습니다')
        setMealData(null)
      } else if (!result.data || result.data.length === 0) {
        setError('급식이 없습니다')
        setMealData(null)
      } else {
        // 점심 메뉴 찾기
        const lunchMenu = result.data.find((meal) => meal.mealType === 'lunch')
        if (lunchMenu) {
          setMealData(lunchMenu)
          setError(null)
        } else {
          setError('점심 급식이 없습니다')
          setMealData(null)
        }
      }

      setIsLoading(false)
    }

    fetchMeal()
  }, [selectedDate])

  // 어제로 이동
  const goToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1))
  }

  // 내일로 이동
  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1))
  }

  // 오늘로 이동
  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // 오늘인지 확인
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <Card className="w-full">
      <CardHeader className="pb-1 pt-3 px-4">
        <div className="flex items-center justify-between mb-0.5">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Utensils className="h-4 w-4" />
            급식 메뉴
          </CardTitle>
          {!isToday && (
            <Button onClick={goToToday} variant="ghost" size="sm" className="h-7 text-xs">
              오늘
            </Button>
          )}
        </div>

        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-between">
          <Button
            onClick={goToPreviousDay}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}
            </span>
          </div>

          <Button
            onClick={goToNextDay}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-3 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="text-sm text-muted-foreground">로딩 중...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : mealData ? (
          <div className="max-h-[120px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="grid grid-cols-4 gap-x-3 gap-y-1.5">
              {mealData.dishes.map((dish, index) => (
                <div key={index} className="text-xs flex items-start">
                  <span className="text-muted-foreground mr-1 mt-0.5 shrink-0">•</span>
                  <span className="break-words">{dish}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
