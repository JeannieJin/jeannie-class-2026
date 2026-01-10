-- 기존 INSERT 정책 삭제
DROP POLICY IF EXISTS "교사는 학생을 추가할 수 있음" ON public.users;

-- 새로운 INSERT 정책들 생성
-- 1. 사용자는 자신의 프로필을 생성할 수 있음 (회원가입용)
CREATE POLICY "사용자는 자신의 프로필을 생성할 수 있음"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. 교사는 학생을 추가할 수 있음 (관리용)
CREATE POLICY "교사는 학생을 추가할 수 있음"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );
