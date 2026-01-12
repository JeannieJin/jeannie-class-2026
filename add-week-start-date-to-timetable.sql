-- 시간표 테이블에 week_start_date 컬럼 추가
-- Supabase SQL 에디터에서 실행하세요

-- 1. week_start_date 컬럼 추가
ALTER TABLE public.timetable
ADD COLUMN week_start_date date;

-- 2. 기존 unique 제약조건 삭제
ALTER TABLE public.timetable
DROP CONSTRAINT IF EXISTS timetable_day_of_week_period_key;

-- 3. 새로운 unique 제약조건 추가 (week_start_date 포함)
ALTER TABLE public.timetable
ADD CONSTRAINT timetable_week_day_period_key
UNIQUE(week_start_date, day_of_week, period);

-- 4. week_start_date 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_timetable_week_start_date
ON public.timetable(week_start_date);

-- 완료!
