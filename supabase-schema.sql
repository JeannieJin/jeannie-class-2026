-- 2026 Jeannie Class 데이터베이스 스키마
-- Supabase SQL 에디터에서 실행하세요

-- UUID 확장 활성화
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. users 테이블 (사용자 - 교사/학생)
-- ============================================================================
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  role text not null check (role in ('teacher', 'student')),
  name text not null,
  student_number integer unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

create policy "사용자는 자신의 데이터를 볼 수 있음"
  on public.users for select
  using (auth.uid() = id);

create policy "교사는 모든 사용자를 볼 수 있음"
  on public.users for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'teacher'
    )
  );

create policy "교사는 학생을 수정할 수 있음"
  on public.users for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'teacher'
    )
  );

create policy "교사는 학생을 추가할 수 있음"
  on public.users for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'teacher'
    )
  );

-- ============================================================================
-- 2. timetable 테이블 (수업 시간표)
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
  on public.timetable for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'teacher'
    )
  );

-- ============================================================================
-- 3. announcements 테이블 (전달사항)
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

create policy "교사는 전달사항을 관리할 수 있음"
  on public.announcements for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'teacher'
    )
  );

-- ============================================================================
-- 4. links 테이블 (참고 링크)
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

create policy "교사는 링크를 관리할 수 있음"
  on public.links for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'teacher'
    )
  );

-- ============================================================================
-- 5. events 테이블 (일정)
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

create policy "학생은 자신의 개인 일정을 관리할 수 있음"
  on public.events for all
  using (
    (user_id = auth.uid() and event_type = 'personal')
  );

create policy "교사는 모든 일정을 관리할 수 있음"
  on public.events for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'teacher'
    )
  );

-- ============================================================================
-- 6. assignments 테이블 (과제)
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

create policy "교사는 과제를 관리할 수 있음"
  on public.assignments for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'teacher'
    )
  );

-- ============================================================================
-- 7. submissions 테이블 (과제 제출)
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

create policy "학생은 자신의 제출을 볼 수 있음"
  on public.submissions for select
  using (student_id = auth.uid());

create policy "교사는 모든 제출을 볼 수 있음"
  on public.submissions for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'teacher'
    )
  );

create policy "학생은 자신의 제출을 추가할 수 있음"
  on public.submissions for insert
  with check (student_id = auth.uid());

create policy "학생은 자신의 제출을 삭제할 수 있음"
  on public.submissions for delete
  using (student_id = auth.uid());

-- ============================================================================
-- 인덱스 생성 (성능 최적화)
-- ============================================================================
create index idx_users_role on public.users(role);
create index idx_timetable_day_period on public.timetable(day_of_week, period);
create index idx_announcements_created_at on public.announcements(created_at desc);
create index idx_announcements_pinned on public.announcements(is_pinned);
create index idx_events_date on public.events(event_date);
create index idx_events_user_type on public.events(user_id, event_type);
create index idx_assignments_subject on public.assignments(subject);
create index idx_submissions_assignment on public.submissions(assignment_id);
create index idx_submissions_student on public.submissions(student_id);

-- ============================================================================
-- updated_at 자동 업데이트 트리거
-- ============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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

-- ============================================================================
-- 8. messages 테이블 (메시지)
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

-- 사용자는 자신이 발신자 또는 수신자인 메시지를 볼 수 있음
create policy "사용자는 자신과 관련된 메시지를 볼 수 있음"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- 학생은 교사에게만 메시지를 보낼 수 있음
create policy "학생은 교사에게만 메시지를 보낼 수 있음"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and (
      exists (
        select 1 from public.users
        where id = auth.uid() and role = 'teacher'
      )
      or
      (
        exists (
          select 1 from public.users
          where id = auth.uid() and role = 'student'
        )
        and
        exists (
          select 1 from public.users
          where id = receiver_id and role = 'teacher'
        )
      )
    )
  );

-- 발신자만 자신의 메시지를 삭제할 수 있음
create policy "발신자만 자신의 메시지를 삭제할 수 있음"
  on public.messages for delete
  using (sender_id = auth.uid());

-- 수신자만 메시지를 읽음 처리할 수 있음
create policy "수신자만 메시지를 읽음 처리할 수 있음"
  on public.messages for update
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- 인덱스 (성능 최적화)
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_receiver on public.messages(receiver_id);
create index idx_messages_created_at on public.messages(created_at desc);
create index idx_messages_is_read on public.messages(is_read);
create index idx_messages_conversation on public.messages(sender_id, receiver_id, created_at desc);

-- updated_at 자동 업데이트 트리거
create trigger set_updated_at before update on public.messages
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- 완료!
-- ============================================================================
-- 이제 Supabase 대시보드에서 Authentication > Users로 이동하여
-- 교사와 학생 계정을 생성하세요.
