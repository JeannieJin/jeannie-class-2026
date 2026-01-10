-- events 테이블에 시간 컬럼 추가
-- Supabase SQL 에디터에서 실행하세요

-- start_time과 end_time 컬럼 추가
alter table public.events
  add column if not exists start_time time,
  add column if not exists end_time time;

-- 인덱스 추가
create index if not exists idx_events_date_time on public.events(event_date, start_time);
