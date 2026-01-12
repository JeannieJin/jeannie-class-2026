-- users 테이블 RLS 정책 수정
-- 학생이 메시지를 주고받는 사용자(교사)의 정보를 볼 수 있도록 허용

-- 기존 정책 삭제
drop policy if exists "사용자 조회 정책" on public.users;

-- 새로운 정책 생성
create policy "사용자 조회 정책"
  on public.users for select
  using (
    -- 본인 정보는 항상 조회 가능
    auth.uid() = id
    or
    -- 교사는 모든 사용자 조회 가능
    public.is_teacher()
    or
    -- 메시지를 주고받는 상대방 정보 조회 가능
    exists (
      select 1 from public.messages
      where (sender_id = auth.uid() and receiver_id = users.id)
         or (sender_id = users.id and receiver_id = auth.uid())
    )
  );
