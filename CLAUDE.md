# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

2026 Jeannie Class - Next.js 15+ 기반 학급 관리 시스템
- 교사와 학생을 위한 학급 운영 플랫폼
- Supabase를 백엔드로 사용하여 인증 및 데이터 관리
- shadcn/ui + Tailwind CSS로 구성된 UI

## 개발 명령어

### 기본 개발
```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 실행
```

### 환경 설정
1. `.env.local.example`을 `.env.local`로 복사
2. Supabase 프로젝트의 URL과 키 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/public 키
   - `SUPABASE_SERVICE_ROLE_KEY`: (선택사항) 서비스 역할 키
3. `supabase-schema.sql` 파일을 Supabase SQL 에디터에서 실행하여 데이터베이스 스키마 생성

## 아키텍처

### 인증 및 세션 관리
- **서버 컴포넌트/Server Actions**: `lib/supabase/server.ts` 사용
- **클라이언트 컴포넌트**: `lib/supabase/client.ts` 사용
- **미들웨어**: 현재 단순화되어 모든 요청 통과 (향후 인증 로직 추가 가능)
- **인증 로직**: `app/actions/auth.ts`에서 login, signup, logout Server Actions 제공

### 데이터베이스 타입 시스템
- `lib/supabase/types.ts`: 데이터베이스 스키마와 일치하는 TypeScript 타입 정의
- Supabase 타입은 `Database` 인터페이스를 통해 타입 안정성 제공
- 주요 테이블: users, timetable, announcements, assignments, submissions, grades 등

### 라우팅 구조
- **루트 페이지**: `app/page.tsx` (랜딩 페이지)
- **인증 라우트**: `app/(auth)/` 그룹 - login, signup 페이지
- **대시보드**: `app/dashboard/page.tsx` (인증 후 메인 화면)
- 경로 별칭: `@/*`는 프로젝트 루트를 가리킴

### UI 컴포넌트
- shadcn/ui 라이브러리 사용 (New York 스타일)
- 모든 UI 컴포넌트는 `components/ui/` 디렉토리에 위치
- Tailwind CSS v4 사용
- 다크모드 지원 (next-themes)

### 주요 디렉토리
```
app/
  ├── (auth)/         # 인증 관련 페이지 (로그인, 회원가입)
  ├── actions/        # Server Actions (auth.ts)
  ├── dashboard/      # 대시보드 페이지
  └── layout.tsx      # 루트 레이아웃

lib/
  ├── supabase/       # Supabase 클라이언트 설정 및 타입
  │   ├── server.ts   # 서버측 클라이언트
  │   ├── client.ts   # 클라이언트측 클라이언트
  │   ├── middleware.ts # 미들웨어용 클라이언트
  │   └── types.ts    # 데이터베이스 타입 정의
  └── utils.ts        # 유틸리티 함수 (cn 등)

components/
  └── ui/             # shadcn/ui 컴포넌트
```

## 데이터베이스 스키마

### 주요 테이블
1. **users**: 사용자 (교사/학생) 정보
   - role: 'teacher' | 'student'
   - 교사는 student_number 불필요, 학생은 필수

2. **timetable**: 수업 시간표
   - day_of_week (0-6), period (1-7)로 시간 슬롯 관리

3. **announcements**: 전달사항
   - priority, is_pinned 지원

4. **assignments**: 과제
   - due_date로 마감일 관리

5. **submissions**: 과제 제출물
   - student_id와 assignment_id로 연결

6. **grades**: 성적 관리

### RLS 정책
- 학생: 자신의 데이터만 조회/수정 가능
- 교사: 모든 데이터 접근 가능 (관리자 역할)
- 공개 데이터 (시간표, 전달사항): 모두 조회 가능

## 개발 참고사항

### Supabase 클라이언트 사용 시
- Server Component/Server Action에서는 반드시 `await createClient()` (server.ts)
- Client Component에서는 `createClient()` (client.ts)
- 두 클라이언트를 혼용하지 않도록 주의

### 타입 안정성
- 데이터베이스 쿼리 시 `Database` 타입을 제네릭으로 전달하여 타입 체크
- 스키마 변경 시 `types.ts` 파일도 함께 업데이트 필요

### 폼 처리
- react-hook-form + zod를 사용하여 폼 유효성 검사
- Server Actions를 통한 서버측 처리 권장

### 스타일링
- Tailwind CSS v4 사용
- 컴포넌트 스타일은 shadcn/ui 패턴 따름
- `cn()` 유틸리티로 조건부 클래스 병합

### Server Actions
- `app/actions/` 디렉토리에 위치
- 주요 Server Actions:
  - `auth.ts`: login, signup, logout, getCurrentUser
  - `assignments.ts`: 과제 관련 작업
  - `submissions.ts`: 과제 제출물 관리
  - `links.ts`: 링크 관리
- 모든 Server Action 파일은 파일 최상단에 `'use server'` 지시어 필수

### 새 UI 컴포넌트 추가
```bash
npx shadcn@latest add <component-name>
```
