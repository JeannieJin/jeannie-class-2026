-- events 테이블의 event_type에 'holiday' 추가
-- Supabase SQL 에디터에서 실행하세요

-- 기존 체크 제약조건 삭제
alter table public.events drop constraint if exists events_event_type_check;

-- 새로운 체크 제약조건 추가 (holiday 포함)
alter table public.events
  add constraint events_event_type_check
  check (event_type in ('class', 'personal', 'holiday'));
