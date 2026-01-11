-- events 테이블 RLS 정책 및 공휴일 데이터 수정
-- Supabase SQL 에디터에서 실행하세요

-- 1. 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "모두 학급 일정을 볼 수 있음" ON public.events;

-- 2. 새로운 SELECT 정책 생성 (holiday 타입 추가)
CREATE POLICY "모두 학급 일정과 공휴일을 볼 수 있음"
  ON public.events FOR SELECT
  USING (
    event_type = 'class' OR
    event_type = 'holiday' OR
    user_id = auth.uid()
  );

-- 3. 공휴일 데이터를 'holiday' 타입으로 변경
-- 새해, 설날, 삼일절, 어린이날, 부처님 오신 날, 현충일, 광복절, 개천절, 추석, 한글날, 성탄절
UPDATE public.events
SET event_type = 'holiday', user_id = NULL
WHERE title IN (
  '새해 첫날',
  '설날 연휴 (전날)',
  '설날',
  '설날 연휴 (다음날)',
  '삼일절',
  '어린이날',
  '부처님 오신 날',
  '현충일',
  '광복절',
  '개천절',
  '추석 연휴 (전날)',
  '추석',
  '추석 연휴 (다음날)',
  '한글날',
  '성탄절'
);

-- 4. 일반 기념일은 'class' 타입 유지, user_id NULL 설정 (모두가 볼 수 있도록)
UPDATE public.events
SET user_id = NULL
WHERE title IN (
  '삼짇날',
  '식목일',
  '어버이날',
  '스승의 날',
  '6.25 전쟁일',
  '제헌절',
  '국군의 날'
)
AND event_type = 'class';
