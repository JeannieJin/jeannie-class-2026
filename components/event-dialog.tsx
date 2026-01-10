'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { createEvent, updateEvent } from '@/app/actions/events'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/types'

type Event = Database['public']['Tables']['events']['Row']

const eventSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  description: z.string().optional(),
  event_date: z.string().min(1, '날짜를 선택하세요'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  event_type: z.enum(['class', 'personal', 'holiday']),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: string
  event?: Event | null
  onSuccess?: () => void
}

export function EventDialog({
  open,
  onOpenChange,
  selectedDate,
  event,
  onSuccess,
}: EventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      event_date: selectedDate || '',
      start_time: '',
      end_time: '',
      event_type: 'class',
    },
  })

  // 기존 일정 데이터로 폼 초기화
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || '',
        event_date: event.event_date,
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        event_type: event.event_type,
      })
    } else if (selectedDate) {
      form.reset({
        title: '',
        description: '',
        event_date: selectedDate,
        start_time: '',
        end_time: '',
        event_type: 'class',
      })
    }
  }, [event, selectedDate, form])

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true)

    try {
      if (event) {
        // 수정
        const result = await updateEvent(event.id, {
          title: data.title,
          description: data.description || null,
          event_date: data.event_date,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
          event_type: data.event_type,
        })

        if (result.error) {
          toast.error('일정 수정 실패', {
            description: result.error,
          })
        } else {
          toast.success('일정이 수정되었습니다.')
          onOpenChange(false)
          onSuccess?.()
        }
      } else {
        // 생성
        const result = await createEvent({
          title: data.title,
          description: data.description || null,
          event_date: data.event_date,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
          event_type: data.event_type,
        })

        if (result.error) {
          toast.error('일정 추가 실패', {
            description: result.error,
          })
        } else {
          toast.success('일정이 추가되었습니다.')
          onOpenChange(false)
          form.reset()
          onSuccess?.()
        }
      }
    } catch (error) {
      toast.error('오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? '일정 수정' : '일정 추가'}</DialogTitle>
          <DialogDescription>
            {event ? '일정 정보를 수정하세요.' : '새로운 일정을 추가하세요.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 체육대회" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명 (선택사항)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="일정에 대한 추가 정보를 입력하세요"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>날짜</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시작 시간 (선택사항)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>종료 시간 (선택사항)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>일정 유형</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="일정 유형을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="class">학급 일정</SelectItem>
                      <SelectItem value="personal">개인 일정</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '저장 중...' : event ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
