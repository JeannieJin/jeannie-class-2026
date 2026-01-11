-- assignments 테이블 스키마 수정
-- 1. subject에 'english' 추가
-- 2. total_points 컬럼 추가

-- 기존 체크 제약 삭제
ALTER TABLE public.assignments
DROP CONSTRAINT IF EXISTS assignments_subject_check;

-- 새로운 체크 제약 추가 (english 포함)
ALTER TABLE public.assignments
ADD CONSTRAINT assignments_subject_check
CHECK (subject IN ('korean', 'math', 'social', 'science', 'english', 'other'));

-- total_points 컬럼 추가
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS total_points integer;

-- 코멘트 추가
COMMENT ON COLUMN public.assignments.total_points IS '과제 배점';
