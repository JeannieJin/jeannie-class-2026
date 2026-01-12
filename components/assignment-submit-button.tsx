'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle } from 'lucide-react'
import { submitAssignment, cancelSubmission } from '@/app/actions/submissions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AssignmentSubmitButtonProps {
  assignmentId: string
  assignmentTitle: string
  isSubmitted: boolean
}

export function AssignmentSubmitButton({
  assignmentId,
  assignmentTitle,
  isSubmitted: initialIsSubmitted,
}: AssignmentSubmitButtonProps) {
  const router = useRouter()
  const [isSubmitted, setIsSubmitted] = useState(initialIsSubmitted)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleSubmit = async () => {
    setIsLoading(true)

    try {
      if (isSubmitted) {
        // 제출 취소
        const result = await cancelSubmission(assignmentId)

        if (result.error) {
          toast.error(result.error)
        } else {
          setIsSubmitted(false)
          toast.success('제출을 취소했습니다')
          router.refresh()
        }
      } else {
        // 제출
        const result = await submitAssignment(assignmentId, '')

        if (result.error) {
          toast.error(result.error)
        } else {
          setIsSubmitted(true)
          toast.success('과제를 제출했습니다')
          router.refresh()
        }
      }
    } catch (error) {
      toast.error('오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isSubmitted ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggleSubmit}
      disabled={isLoading}
      className="gap-1.5"
    >
      {isSubmitted ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          제출완료
        </>
      ) : (
        <>
          <Circle className="h-4 w-4" />
          제출하기
        </>
      )}
    </Button>
  )
}
