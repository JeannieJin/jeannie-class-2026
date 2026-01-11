# 데이터베이스 마이그레이션 가이드

이 디렉토리에는 데이터베이스 스키마 변경 및 데이터 삽입을 위한 SQL 스크립트가 포함되어 있습니다.

## 마이그레이션 실행 방법

### 1. Supabase 대시보드 접속

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2. 마이그레이션 스크립트 실행

#### 필수: assignments 테이블 스키마 수정

**파일:** `fix-assignments-table.sql`

**목적:**
- subject에 'english' 과목 추가
- total_points 컬럼 추가 (과제 배점)

**실행 방법:**
1. SQL Editor에서 **New Query** 클릭
2. `fix-assignments-table.sql` 파일의 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭

**결과:**
- 이제 영어 과제를 생성할 수 있습니다
- 과제 생성 시 배점을 지정할 수 있습니다

---

#### 필수: 2026~2027년 공휴일 및 기념일 등록

**파일:** `insert-holidays-2026-2027.sql`

**목적:**
- 2026~2027년 대한민국 공휴일 등록
- 주요 기념일 등록
- 모든 학생이 일정에서 공휴일을 볼 수 있도록 설정

**실행 방법:**
1. SQL Editor에서 **New Query** 클릭
2. `insert-holidays-2026-2027.sql` 파일의 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭

**결과:**
- 일정 페이지에 2026~2027년 공휴일과 기념일이 표시됩니다
- 학생도 일정에서 공휴일을 확인할 수 있습니다

**등록되는 공휴일 (2026~2027):**
- 새해 첫날
- 설날 연휴 (3일)
- 삼일절
- 어린이날
- 부처님 오신 날
- 현충일
- 광복절
- 추석 연휴 (3일)
- 개천절
- 한글날
- 성탄절

**등록되는 기념일:**
- 삼짇날
- 식목일
- 어버이날
- 스승의 날
- 6.25 전쟁일
- 제헌절
- 국군의 날

---

## 주의사항

### ⚠️ 실행 순서

1. **먼저** `fix-assignments-table.sql` 실행
2. **그 다음** `insert-holidays-2026-2027.sql` 실행

### ⚠️ 교사 계정 필수

`insert-holidays-2026-2027.sql` 스크립트를 실행하기 전에 **최소 1명의 교사 계정**이 데이터베이스에 존재해야 합니다.

교사 계정이 없으면 다음 에러가 발생합니다:
```
ERROR: 교사 계정이 존재하지 않습니다. 먼저 교사 계정을 생성해주세요.
```

### ⚠️ 재실행

- `fix-assignments-table.sql`: 여러 번 실행해도 안전합니다 (IF NOT EXISTS 사용)
- `insert-holidays-2026-2027.sql`: 여러 번 실행해도 안전합니다 (ON CONFLICT DO NOTHING 사용)

---

## 문제 해결

### assignments 테이블 수정 후에도 과제 생성 실패

1. 브라우저 캐시를 지우고 페이지 새로고침
2. 개발 서버를 재시작: `npm run dev`
3. Supabase SQL Editor에서 확인:
   ```sql
   -- subject에 english가 포함되어 있는지 확인
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'assignments';
   ```

### 공휴일이 일정에 표시되지 않음

1. Supabase SQL Editor에서 확인:
   ```sql
   -- 등록된 공휴일 확인
   SELECT * FROM public.events
   WHERE event_type = 'class'
   AND event_date >= '2026-01-01'
   ORDER BY event_date;
   ```

2. 일정 페이지를 새로고침
3. 학생 계정으로 로그인하여 확인

---

## 버전 관리

- **작성일:** 2026-01-13
- **최종 수정:** 2026-01-13
- **적용 버전:** v1.0.0

---

## 추가 마이그레이션

향후 추가 마이그레이션이 필요한 경우:

1. 이 디렉토리에 새로운 `.sql` 파일 생성
2. 파일명 형식: `YYYY-MM-DD-description.sql`
3. 이 README에 실행 방법 추가
4. Git 커밋 및 푸시
