-- 시간표 테이블 업데이트: 주간별 관리 기능 추가
-- Supabase SQL 에디터에서 실행하세요

-- 1. 기존 timetable 테이블 삭제 (백업 후 실행)
DROP TABLE IF EXISTS public.timetable CASCADE;

-- 2. 새로운 timetable 테이블 생성
CREATE TABLE public.timetable (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_start_date date NOT NULL, -- 주간 시작일 (월요일)
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1:월 ~ 5:금
  period integer NOT NULL CHECK (period BETWEEN 1 AND 6), -- 1~6교시
  subject text, -- 과목명
  is_holiday boolean DEFAULT false, -- 휴일 여부
  teacher_note text,
  created_by uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(week_start_date, day_of_week, period) -- 주간+요일+교시 조합은 고유
);

-- 3. RLS 정책
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모두 시간표를 볼 수 있음"
  ON public.timetable FOR SELECT
  USING (true);

CREATE POLICY "교사는 시간표를 관리할 수 있음"
  ON public.timetable FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- 4. 인덱스 생성
CREATE INDEX idx_timetable_week ON public.timetable(week_start_date);
CREATE INDEX idx_timetable_week_day ON public.timetable(week_start_date, day_of_week);

-- 5. updated_at 트리거
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.timetable
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. users 테이블에 프로필 이미지 필드 추가
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON COLUMN public.users.avatar_url IS '프로필 이미지 URL (Supabase Storage)';
