# 발명씨앗 Lab (Invention Seed Lab) - 1차 MVP

초·중·고 학생 발명대회 출품 및 학생 특허 출원 가능성이 높은 창의적 발명 아이디어를 매일 생산하고, 심사·평가하여 우수 후보 또는 실패 데이터베이스로 자동 분류·관리하는 전문 발명 코칭 연구실 웹 플랫폼입니다.

---

## 1. 주요 핵심 기능
1. **대시보드 (`/`)**: 누적 및 오늘 생성 수치, 7일 평균 점수, 분야별 점유율을 시각화하고 상위 평점/최근 생성 목록 제공.
2. **오늘의 아이디어 (`/today`)**: 오늘 생성된 아이디어를 한눈에 보며 점수를 직관적으로 입력하는 일일 평가판.
3. **아이디어 생성실 (`/generate`)**: 분야 영역, 대상 학년, 생성 기준(불편함 기반, 뉴스 기사 기반 등)을 필터링해 AI에게 신규 제안을 일괄 요청하고 검토 후 저장.
4. **아이디어 저장소 (`/ideas`)**: 평점 3.5점 이상 및 검토 단계(draft)인 아이디어를 다각도로 검색(텍스트, 분야, 학년)하고 정렬(최신순, 평점순, 난이도순).
5. **실패 분석소 (`/failures`)**: 3.5점 미만을 받아 제외된 아이디어를 삭제하지 않고 실패 원인과 약점, 개선 여지를 분석하는 기하적 데이터베이스.
6. **불편함 입력실 (`/painpoints`)**: 실생활에서 겪은 날것의 불편함을 텍스트로 치면 AI가 문제를 추출하고 3~5개의 발명 솔루션 후보를 피드백하여 저장.
7. **발전 연구실 (`/develop/[ideaId]`)**: 아이디어를 심화 고도화하여 **이상적 해결방법**(센서/AI 연동)과 **현실적 해결방법**(아두이노/3D프린터 등)을 도출하고, 특허/제품/대회용 검색 키워드 클립보드 복사 제공.
8. **환경 설정 (`/settings`)**: AI 모델 전환, 봇 연동 토큰, 평점 임계값(Threshold) 및 수동 생성 개수를 즉각 수정 및 동기화.

---

## 2. 아키텍처 명세

### 2-1. signed HttpOnly Cookie 기반 보안 간이 인증
- `/api/auth/login`을 통해 서버사이드에서 비밀번호를 대조하여 암호화 토큰(JWT)을 생성합니다.
- 발급된 토큰은 클라이언트 `localStorage`가 아닌, 자바스크립트로 접근할 수 없는 **HttpOnly, Secure, SameSite=Strict** 쿠키에 저장됩니다.
- Next.js 미들웨어(`middleware.ts`)가 라우팅 시 쿠키의 존재를 사전 체크하여 로그인 상태가 아니면 `/login`으로 자동 리다이렉트합니다.
- 서버 API Route는 내부 `verifyAdmin()` 헬퍼를 사용해 2중 정밀 토큰 해독 검증을 거칩니다.

### 2-2. AI Provider Adapter 패턴 (Gemini & OpenAI Fallback)
- `lib/ai/index.ts`를 중추로 하여 `AiProvider` 인터페이스를 거칩니다.
- 환경 변수 `AI_PROVIDER`가 `gemini`로 지정되면 기본 엔진인 **Gemini API**(`gemini-2.5-flash`)를 우선 호출합니다.
- 만약 할당량 초과, 타임아웃, API 장애 등이 발생하면 **OpenAI API**(`gpt-4o-mini`)로 자동으로 전환(Fallback)되어 끊김 없는 서비스를 보장합니다.
- 모든 API 실행 내역은 성공/실패 유형과 함께 Firestore `aiLogs` 컬렉션에 자동 로깅되어 관리자가 감시할 수 있습니다.

### 2-3. Firestore Transaction 기반 일관성 평가 파이프라인
- `/api/ideas/[ideaId]/rate`를 거쳐 평가 점수를 제출할 때 Firestore의 동시성 트랜잭션을 적용합니다.
- 트랜잭션 내부에서 평균 점수를 소수 둘째 자리까지 정밀 연산하고, 3.5점 기준으로 `ideas` 문서의 평점/상태 업데이트 및 `failures` 보관소 업서트/삭제 처리를 원자적으로 완수합니다.

---

## 3. 로컬 설치 및 실행 방법

### 3-1. 환경 변수 구성
루트 경로에 `.env.local` 파일을 생성하고 다음 항목을 기입해 주십시오. (템플릿은 `.env.local.example` 참조)
```env
# 관리자 콘솔 입장 비밀번호 및 토큰 시크릿
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_jwt_signing_secret_key_at_least_32_characters

# Firebase API 설정 (프로젝트 콘솔에서 확인 가능)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# AI Keys
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
```

### 3-2. 의존성 설치
```bash
npm install
```

### 3-3. 로컬 개발 서버 구동
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속할 수 있습니다. (첫 진입 시 `.env.local`에 기입한 `ADMIN_PASSWORD`로 입장 가능)

### 3-4. 배포용 빌드 검증
```bash
npm run build
```
Turbopack 및 TypeScript 엄격 모드 컴파일 성공을 완료했습니다.
