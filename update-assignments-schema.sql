-- 과제 및 제출 테이블 업데이트
-- Supabase SQL 에디터에서 실행하세요

-- 1. assignments 테이블에 필드 추가
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS total_points integer,
  ALTER COLUMN due_date TYPE timestamp with time zone USING due_date::timestamp with time zone;

-- 2. assignments 테이블의 subject 체크 제약 업데이트 (english 추가)
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_subject_check;
ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_subject_check
  CHECK (subject IN ('korean', 'math', 'social', 'science', 'english', 'other'));

-- 3. submissions 테이블에 status 필드 추가
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded'));

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- 완료!
COMMENT ON COLUMN public.assignments.total_points IS '과제 배점';
COMMENT ON COLUMN public.submissions.status IS '제출 상태 (submitted, graded)';
