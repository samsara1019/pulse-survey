# Pulse Check 앱 개선 구현 가이드

## 개요
이 문서는 Pulse Check 앱에 추가된 새로운 기능들의 구현 내용과 설정 방법을 설명합니다.

## 구현된 기능

### 1. 관리자 페이지 (질문 CRUD)
- **경로**: `/admin` 또는 `/admin/questions`
- **기능**:
  - 질문 추가, 수정, 삭제
  - 드래그 앤 드롭으로 질문 순서 변경
  - 질문 활성화/비활성화 토글
  - 1-5점 평가(rating) 또는 주관식(text) 질문 타입 선택

### 2. 관리자 인증 시스템
- **로그인 페이지**: `/login`
- **지원 방식**:
  - 이메일/비밀번호 로그인
  - Google OAuth
  - GitHub OAuth
- **접근 제어**:
  - `/results` 페이지는 관리자만 접근 가능
  - `/admin` 페이지는 관리자만 접근 가능

### 3. 개선된 주차 계산 시스템
- 응답 시 `submitted_at` 컬럼에 날짜 저장
- 그래프 표시 시 실시간으로 주차 계산
- 월 경계를 넘어가는 주차도 정확하게 처리

### 4. 그래프 추세 분석
- 전주 대비 변화율(%) 표시
- 상승/하락/유지 방향 표시 (↑ ↓ →)
- 커스텀 툴팁에 상세 정보 표시

## 설치 및 설정

### 1. Supabase 데이터베이스 설정

1. Supabase 대시보드에서 SQL Editor 열기
2. `supabase-migration.sql` 파일의 내용을 복사하여 실행
3. 마이그레이션이 성공적으로 완료되면 다음 테이블이 생성됩니다:
   - `questions` - 동적 질문 관리
   - `admins` - 관리자 권한 관리
   - `pulse_surveys` - 기존 테이블에 `submitted_at` 컬럼 추가

### 2. 첫 번째 관리자 추가

#### 방법 1: Supabase Auth에서 직접 추가
1. Supabase 대시보드 → Authentication → Users
2. "Add user" 클릭하여 관리자 계정 생성
3. SQL Editor에서 다음 쿼리 실행:

```sql
INSERT INTO admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com'
ON CONFLICT DO NOTHING;
```

#### 방법 2: 회원가입 후 추가
1. 앱의 로그인 페이지(`/login`)에서 회원가입
2. 위의 SQL 쿼리를 실행하여 관리자로 등록

### 3. OAuth 설정 (선택사항)

#### Google OAuth
1. Supabase 대시보드 → Authentication → Providers → Google
2. "Enable Google provider" 체크
3. Google Cloud Console에서 OAuth 클라이언트 ID 생성
4. Client ID와 Client Secret을 Supabase에 입력
5. Authorized redirect URIs에 Supabase redirect URL 추가

#### GitHub OAuth
1. Supabase 대시보드 → Authentication → Providers → GitHub
2. "Enable GitHub provider" 체크
3. GitHub → Settings → Developer settings → OAuth Apps
4. New OAuth App 생성
5. Client ID와 Client Secret을 Supabase에 입력

### 4. 환경 변수 설정

`.env` 파일이 다음 변수를 포함하는지 확인:

```env
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key
```

## 사용 방법

### 관리자 워크플로우

1. **로그인**
   - `/login` 페이지 방문
   - 이메일/비밀번호 또는 OAuth로 로그인

2. **질문 관리**
   - `/admin` 페이지에서 질문 추가/수정/삭제
   - 드래그로 순서 변경
   - 활성화/비활성화 토글로 설문에서 숨기기/표시

3. **결과 확인**
   - `/results` 페이지에서 주차별 추이 확인
   - 각 질문별 전주 대비 변화율 확인
   - 그래프 마우스오버로 상세 정보 확인

### 사용자 워크플로우

1. 메인 페이지(`/`)에서 설문 시작
2. 활성화된 질문들에 응답
3. 제출 후 자동으로 결과 페이지로 이동 (권한 없으면 로그인 페이지로 리다이렉트)

## 파일 구조

```
src/
├── components/
│   └── admin/
│       ├── QuestionForm.jsx      # 질문 추가/수정 폼
│       ├── QuestionItem.jsx      # 개별 질문 아이템
│       └── QuestionList.jsx      # 질문 목록 (드래그 앤 드롭)
├── hooks/
│   └── useAdminAuth.js           # 관리자 인증 훅
├── pages/
│   ├── admin/
│   │   └── QuestionsPage.jsx    # 관리자 질문 관리 페이지
│   ├── LoginPage.jsx             # 로그인 페이지
│   ├── ResultsPage.jsx           # 결과 페이지 (개선됨)
│   ├── SurveyPage.jsx            # 설문 페이지
│   └── WelcomePage.jsx           # 메인 페이지
├── utils/
│   └── dateUtils.js              # 날짜 및 주차 계산 유틸리티
├── lib/
│   └── supabaseClient.js         # Supabase 클라이언트
└── App.js                         # 라우팅 설정
```

## 데이터베이스 스키마

### questions 테이블
```sql
- id: UUID (PK)
- question_text: TEXT (질문 내용)
- question_type: VARCHAR(20) (rating | text)
- order_index: INTEGER (표시 순서)
- is_active: BOOLEAN (활성화 여부)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### admins 테이블
```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- email: TEXT (관리자 이메일)
- created_at: TIMESTAMP
```

### pulse_surveys 테이블 (수정됨)
```sql
기존 컬럼들...
+ submitted_at: TIMESTAMP (응답 제출 시각)
```

## API 사용 예시

### 질문 가져오기
```javascript
const { data, error } = await supabase
  .from('questions')
  .select('*')
  .eq('is_active', true)
  .order('order_index', { ascending: true });
```

### 질문 추가
```javascript
const { error } = await supabase
  .from('questions')
  .insert([{
    question_text: '새 질문',
    question_type: 'rating',
    order_index: 1,
    is_active: true
  }]);
```

### 관리자 확인
```javascript
const { data: { user } } = await supabase.auth.getUser();
const { data } = await supabase
  .from('admins')
  .select('id')
  .eq('user_id', user.id)
  .single();
const isAdmin = !!data;
```

## 문제 해결

### 로그인 후 관리자 페이지에 접근할 수 없음
- `admins` 테이블에 사용자가 추가되었는지 확인
- Supabase RLS 정책이 올바르게 설정되었는지 확인

### 그래프에 데이터가 표시되지 않음
- `pulse_surveys` 테이블에 `submitted_at` 컬럼이 있는지 확인
- 기존 데이터의 `submitted_at`을 `created_at`으로 채웠는지 확인

### OAuth 로그인이 작동하지 않음
- Supabase의 Provider 설정 확인
- Redirect URL이 올바르게 설정되었는지 확인
- OAuth App의 Client ID/Secret이 정확한지 확인

## 향후 개선 사항

1. **관리자 관리 페이지**: 다른 관리자 추가/제거 UI
2. **질문 프리셋**: 자주 사용하는 질문 템플릿
3. **응답 필터링**: 날짜 범위, 팀별 필터
4. **대시보드**: 주요 지표 한눈에 보기
5. **알림 시스템**: 주차별 설문 알림
6. **데이터 내보내기**: CSV, Excel 형식으로 결과 다운로드

## 보안 고려사항

1. **RLS (Row Level Security)**
   - 모든 테이블에 RLS 활성화
   - 관리자만 질문 관리 가능
   - 일반 사용자는 활성화된 질문만 읽기 가능

2. **인증**
   - Supabase Auth를 통한 안전한 인증
   - JWT 토큰 기반 세션 관리
   - OAuth를 통한 소셜 로그인

3. **환경 변수**
   - 민감한 정보는 `.env` 파일에 저장
   - `.env` 파일은 `.gitignore`에 포함

## 라이센스

이 프로젝트는 기존 Pulse Check 앱의 일부입니다.
