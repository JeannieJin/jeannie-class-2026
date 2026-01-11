-- 2026 Jeannie Class 데이터베이스 마이그레이션 (최적화 버전)
-- 기존 스키마를 삭제하고 새로운 스키마를 적용합니다
-- 주의: 이 스크립트는 모든 데이터를 삭제합니다!

-- ============================================================================
-- 1. 기존 테이블, 함수, 트리거 삭제
-- ============================================================================

-- 트리거 삭제
drop trigger if exists set_updated_at on public.messages;
drop trigger if exists set_updated_at on public.submissions;
drop trigger if exists set_updated_at on public.assignments;
drop trigger if exists set_updated_at on public.events;
drop trigger if exists set_updated_at on public.links;
drop trigger if exists set_updated_at on public.announcements;
drop trigger if exists set_updated_at on public.timetable;
drop trigger if exists set_updated_at on public.users;

-- 함수 삭제
drop function if exists public.handle_updated_at();
drop function if exists public.is_teacher();
drop function if exists public.current_user_role();

-- 테이블 삭제 (외래키 종속성 순서에 맞춰)
drop table if exists public.messages cascade;
drop table if exists public.submissions cascade;
drop table if exists public.assignments cascade;
drop table if exists public.events cascade;
drop table if exists public.links cascade;
drop table if exists public.announcements cascade;
drop table if exists public.timetable cascade;
drop table if exists public.users cascade;

-- ============================================================================
-- 2. 유틸리티 함수 생성 (RLS 성능 최적화용)
-- ============================================================================

-- 현재 사용자가 교사인지 확인하는 함수
create or replace function public.is_teacher()
returns boolean
stable
security definer
set search_path = public
language plpgsql
as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid() and role = 'teacher'
  );
end;
$$;

-- 현재 사용자의 역할을 반환하는 함수
create or replace function public.current_user_role()
returns text
stable
security definer
set search_path = public
language sql
as $$
  select role from public.users where id = auth.uid();
$$;

-- ============================================================================
-- 3. 새로운 스키마 적용
-- ============================================================================

-- UUID 확장 활성화
create extension if not exists "uuid-ossp";

-- ============================================================================
-- users 테이블 (사용자 - 교사/학생)
-- ============================================================================
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  role text not null check (role in ('teacher', 'student')),
  name text not null,
  student_number integer unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

-- 단일 SELECT 정책으로 통합
create policy "사용자 조회 정책"
  on public.users for select
  using (auth.uid() = id or public.is_teacher());

create policy "교사는 학생을 수정할 수 있음"
  on public.users for update
  using (public.is_teacher());

create policy "교사는 학생을 추가할 수 있음"
  on public.users for insert
  with check (public.is_teacher());

-- ============================================================================
-- timetable 테이블 (수업 시간표)
-- ============================================================================
create table public.timetable (
  id uuid default uuid_generate_v4() primary key,
  day_of_week integer not null check (day_of_week between 0 and 6),
  period integer not null check (period between 1 and 7),
  subject text not null,
  teacher_note text,
  created_by uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(day_of_week, period)
);

alter table public.timetable enable row level security;

create policy "모두 시간표를 볼 수 있음"
  on public.timetable for select
  using (true);

create policy "교사는 시간표를 관리할 수 있음"
  on public.timetable for insert
  with check (public.is_teacher());

create policy "교사는 시간표를 업데이트할 수 있음"
  on public.timetable for update
  using (public.is_teacher());

create policy "교사는 시간표를 삭제할 수 있음"
  on public.timetable for delete
  using (public.is_teacher());

-- ============================================================================
-- announcements 테이블 (전달사항)
-- ============================================================================
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  is_pinned boolean default false,
  created_by uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.announcements enable row level security;

create policy "모두 전달사항을 볼 수 있음"
  on public.announcements for select
  using (true);

create policy "교사는 전달사항을 작성할 수 있음"
  on public.announcements for insert
  with check (public.is_teacher());

create policy "교사는 전달사항을 수정할 수 있음"
  on public.announcements for update
  using (public.is_teacher());

create policy "교사는 전달사항을 삭제할 수 있음"
  on public.announcements for delete
  using (public.is_teacher());

-- ============================================================================
-- links 테이블 (참고 링크)
-- ============================================================================
create table public.links (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  url text not null,
  description text,
  category text,
  order_index integer default 0,
  created_by uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.links enable row level security;

create policy "모두 링크를 볼 수 있음"
  on public.links for select
  using (true);

create policy "교사는 링크를 작성할 수 있음"
  on public.links for insert
  with check (public.is_teacher());

create policy "교사는 링크를 수정할 수 있음"
  on public.links for update
  using (public.is_teacher());

create policy "교사는 링크를 삭제할 수 있음"
  on public.links for delete
  using (public.is_teacher());

-- ============================================================================
-- events 테이블 (일정)
-- ============================================================================
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  event_date date not null,
  event_type text check (event_type in ('class', 'personal')) default 'class',
  is_completed boolean default false,
  user_id uuid references public.users(id) on delete cascade,
  created_by uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.events enable row level security;

create policy "모두 학급 일정을 볼 수 있음"
  on public.events for select
  using (event_type = 'class' or user_id = auth.uid());

create policy "학생은 자신의 개인 일정을 작성할 수 있음"
  on public.events for insert
  with check (user_id = auth.uid() and event_type = 'personal');

create policy "학생은 자신의 개인 일정을 수정할 수 있음"
  on public.events for update
  using (user_id = auth.uid() and event_type = 'personal');

create policy "학생은 자신의 개인 일정을 삭제할 수 있음"
  on public.events for delete
  using (user_id = auth.uid() and event_type = 'personal');

create policy "교사는 모든 일정을 작성할 수 있음"
  on public.events for insert
  with check (public.is_teacher());

create policy "교사는 모든 일정을 수정할 수 있음"
  on public.events for update
  using (public.is_teacher());

create policy "교사는 모든 일정을 삭제할 수 있음"
  on public.events for delete
  using (public.is_teacher());

-- ============================================================================
-- assignments 테이블 (과제)
-- ============================================================================
create table public.assignments (
  id uuid default uuid_generate_v4() primary key,
  subject text not null check (subject in ('korean', 'math', 'social', 'science', 'other')),
  title text not null,
  description text,
  external_url text,
  due_date date,
  created_by uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.assignments enable row level security;

create policy "모두 과제를 볼 수 있음"
  on public.assignments for select
  using (true);

create policy "교사는 과제를 작성할 수 있음"
  on public.assignments for insert
  with check (public.is_teacher());

create policy "교사는 과제를 수정할 수 있음"
  on public.assignments for update
  using (public.is_teacher());

create policy "교사는 과제를 삭제할 수 있음"
  on public.assignments for delete
  using (public.is_teacher());

-- ============================================================================
-- submissions 테이블 (과제 제출)
-- ============================================================================
create table public.submissions (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  student_id uuid references public.users(id) on delete cascade not null,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  note text,
  unique(assignment_id, student_id)
);

alter table public.submissions enable row level security;

-- 단일 SELECT 정책으로 통합
create policy "제출 내역 조회 정책"
  on public.submissions for select
  using (student_id = auth.uid() or public.is_teacher());

create policy "학생은 자신의 제출을 추가할 수 있음"
  on public.submissions for insert
  with check (student_id = auth.uid());

create policy "학생은 자신의 제출을 삭제할 수 있음"
  on public.submissions for delete
  using (student_id = auth.uid());

-- ============================================================================
-- messages 테이블 (메시지)
-- ============================================================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint different_users check (sender_id != receiver_id)
);

alter table public.messages enable row level security;

create policy "사용자는 자신과 관련된 메시지를 볼 수 있음"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "메시지 전송 정책"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and (
      public.is_teacher()
      or
      (
        public.current_user_role() = 'student'
        and
        exists (
          select 1 from public.users
          where id = receiver_id and role = 'teacher'
        )
      )
    )
  );

create policy "발신자만 자신의 메시지를 삭제할 수 있음"
  on public.messages for delete
  using (sender_id = auth.uid());

create policy "수신자만 메시지를 읽음 처리할 수 있음"
  on public.messages for update
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- ============================================================================
-- 인덱스 생성 (성능 최적화)
-- ============================================================================
create index idx_users_role on public.users(role);

-- 외래키 인덱스
create index idx_timetable_created_by on public.timetable(created_by);
create index idx_announcements_created_by on public.announcements(created_by);
create index idx_links_created_by on public.links(created_by);
create index idx_events_user_id on public.events(user_id);
create index idx_events_created_by on public.events(created_by);
create index idx_assignments_created_by on public.assignments(created_by);
create index idx_submissions_assignment on public.submissions(assignment_id);
create index idx_submissions_student on public.submissions(student_id);

-- 기타 인덱스
create index idx_timetable_day_period on public.timetable(day_of_week, period);
create index idx_announcements_created_at on public.announcements(created_at desc);
create index idx_announcements_pinned on public.announcements(is_pinned);
create index idx_events_date on public.events(event_date);
create index idx_assignments_subject on public.assignments(subject);

-- messages 테이블 인덱스
create index idx_messages_receiver on public.messages(receiver_id);
create index idx_messages_conversation on public.messages(sender_id, receiver_id, created_at desc);
create index idx_messages_receiver_unread on public.messages(receiver_id, is_read) where is_read = false;

-- ============================================================================
-- updated_at 자동 업데이트 트리거 함수
-- ============================================================================
create or replace function public.handle_updated_at()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 트리거 생성
-- ============================================================================
create trigger set_updated_at before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.timetable
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.announcements
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.links
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.events
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.assignments
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.messages
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- 완료!
-- ============================================================================
-- Performance Advisor 개선사항:
-- 1. is_teacher() 함수: 교사 권한 체크를 캐싱하여 성능 개선
-- 2. current_user_role() 함수: 역할 조회를 캐싱
-- 3. 중복 정책 병합: Multiple Permissive Policies 경고 해결
-- 4. stable 함수 속성: 함수 결과 캐싱 활성화
--
-- Security Advisor의 "Leaked Password Protection Disabled" 경고는
-- Supabase 대시보드 > Authentication > Settings 에서 활성화하세요.
-- ============================================================================
