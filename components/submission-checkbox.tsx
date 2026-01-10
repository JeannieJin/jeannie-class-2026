'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleSubmission } from '@/app/actions/submissions'
import { useToast } from '@/hooks/use-toast'

interface SubmissionCheckboxProps {
  assignmentId: string
  initialChecked: boolean
}

export function SubmissionCheckbox({ assignmentId, initialChecked }: SubmissionCheckboxProps) {
  const [checked, setChecked] = useState(initialChecked)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleChange = async () => {
    setLoading(true)
    try {
      const result = await toggleSubmission(assignmentId)

      if (result.error) {
        toast({
          title: '오류',
          description: result.error,
          variant: 'destructive'
        })
      } else {
        setChecked(result.submitted!)
        toast({
          title: result.submitted ? '제출 완료' : '제출 취소',
          description: result.submitted
            ? '과제가 제출되었습니다.'
            : '과제 제출이 취소되었습니다.'
        })
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '제출 상태 변경 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={handleChange}
      disabled={loading}
      className="h-5 w-5"
    />
  )
}
