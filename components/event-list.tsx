'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Clock, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { deleteEvent } from '@/app/actions/events'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/types'

type Event = Database['public']['Tables']['events']['Row']

interface EventListProps {
  date: string
  events: Event[]
  onEdit: (event: Event) => void
  onRefresh: () => void
  userRole?: 'teacher' | 'student'
}

export function EventList({
  date,
  events,
  onEdit,
  onRefresh,
  userRole,
}: EventListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)

  const formattedDate = format(new Date(date), 'M월 d일 (E)', { locale: ko })

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return

    const result = await deleteEvent(eventToDelete.id)

    if (result.error) {
      toast.error('일정 삭제 실패', {
        description: result.error,
      })
    } else {
      toast.success('일정이 삭제되었습니다.')
      onRefresh()
    }

    setDeleteDialogOpen(false)
    setEventToDelete(null)
  }

  const formatTime = (time: string | null) => {
    if (!time) return null
    return time.slice(0, 5) // HH:MM 형식으로
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{formattedDate}</CardTitle>
          <CardDescription>
            {events.length === 0
              ? '등록된 일정이 없습니다.'
              : `${events.length}개의 일정`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              이 날짜에 등록된 일정이 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const isHoliday = event.event_type === 'holiday'

                return (
                  <div
                    key={event.id}
                    className={cn(
                      'flex items-start justify-between gap-4 rounded-lg border p-4',
                      isHoliday && 'border-red-200 bg-red-50/50'
                    )}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={cn(
                            'font-semibold',
                            isHoliday && 'text-red-600'
                          )}
                        >
                          {event.title}
                        </h4>
                        <Badge
                          variant={
                            isHoliday
                              ? 'destructive'
                              : event.event_type === 'class'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {isHoliday
                            ? '공휴일'
                            : event.event_type === 'class'
                            ? '학급'
                            : '개인'}
                        </Badge>
                      </div>

                      {event.description && (
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}

                      {(event.start_time || event.end_time) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatTime(event.start_time)}
                            {event.start_time && event.end_time && ' ~ '}
                            {formatTime(event.end_time)}
                          </span>
                        </div>
                      )}
                    </div>

                    {userRole === 'teacher' && !isHoliday && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(event)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 취소할 수 없습니다. 일정이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
