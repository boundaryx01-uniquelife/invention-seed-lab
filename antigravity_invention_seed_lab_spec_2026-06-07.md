# 발명씨앗 Lab Antigravity 개발 지시서

작성일: 2026-06-07  
프로젝트명: **발명씨앗 Lab / Invention Seed Lab**  
목적: 초·중·고 학생 발명대회 및 학생 특허 등록 가능성이 있는 발명 아이디어를 매일 생성하고, 사용자의 평가를 통해 저장·실패·우수 후보로 분류하며, 선택한 아이디어를 발전시킬 수 있는 능동형 웹페이지를 만든다.

---

## 0. 프로젝트 한 줄 정의

**발명씨앗 Lab**은 초·중·고 학생 발명대회에 적합한 새로운 발명 아이디어를 영역별로 매일 제안하고, 사용자의 평가를 받아 점수화·분류·저장·발전시키는 발명 주제 발굴 플랫폼이다.

이 서비스는 단순한 아이디어 생성기가 아니라 다음 과정을 지원해야 한다.

```text
최근 문제/불편함/사회 이슈 수집
↓
영역별 발명 아이디어 생성
↓
사용자 평가
↓
보통 이상 아이디어 저장
↓
낮은 평가 아이디어 실패 목록 저장
↓
우수 아이디어 발전
↓
검색·검토용 키워드 제공
↓
학생 발명대회 주제 후보로 관리
```

---

## 1. 핵심 요구사항

### 1-1. 필수 목표

1. 초·중·고등학교 발명대회에 나갈 만한 새로운 주제를 생성한다.
2. 학생 특허 등록 가능성이 있는 주제를 우선적으로 제안한다.
3. 아이디어를 영역별로 세분화하여 제시한다.
4. 아이디어 초안을 카드 형태로 제시한다.
5. 사용자가 아이디어를 평가하면 점수를 계산한다.
6. 평가 결과가 보통 이상이면 저장 목록에 저장한다.
7. 평가 결과가 낮으면 실패 목록에 저장한다.
8. 웹페이지에서 저장된 아이디어, 실패 아이디어, 우수 후보를 검색·필터링할 수 있어야 한다.
9. 사용자가 발전 방향을 원하면 AI가 추가 발전안을 제시한다.
10. 발전안은 반드시 **이상적인 해결방법**과 **현실적인 해결방법**으로 나누어 제시한다.
11. 아이디어 제시의 근거는 최근 기사, 생활 불편함, 사람들의 후기·민원·리뷰, 학교 현장 문제 등에서 출발해야 한다.
12. 사용자가 직접 불편함을 입력하면, 그 불편함을 분석하고 발명 아이디어 후보로 바꿔준다.
13. 추후 텔레그램 연동이 가능하도록 구조를 설계한다.

---

## 2. 개발 우선순위

### 1단계 MVP

처음에는 웹페이지 중심으로 구현한다. 텔레그램과 자동 크론은 후순위다.

필수 구현:

1. Next.js 프로젝트 생성
2. Firebase Firestore 연동
3. 관리자용 기본 화면 구성
4. 아이디어 수동 생성 버튼
5. AI 아이디어 카드 생성
6. 아이디어 평가 입력
7. 평균 점수 자동 계산
8. 평균 점수에 따른 상태 자동 분류
9. 저장 목록
10. 실패 목록
11. 우수 후보 목록
12. 아이디어 상세 보기
13. 아이디어 발전시키기 기능
14. 발전 결과 저장

### 2단계 자동화

1. 매일 정해진 시간에 아이디어 자동 생성
2. 영역별 균형 생성
3. 중복 아이디어 방지
4. 최근 생성 아이디어와 유사한 아이디어 필터링

### 3단계 텔레그램 연동

1. 오늘의 아이디어 텔레그램 발송
2. 텔레그램에서 저장 / 실패 / 발전 요청 버튼 제공
3. 우수 후보 주간 요약 발송

### 4단계 검색 근거 강화

1. 최근 기사 기반 아이디어 생성
2. 제품 리뷰·불편함 기반 아이디어 생성
3. 특허 검색 키워드 자동 생성
4. 전국학생과학발명품경진대회 수상작 검색 키워드 자동 생성
5. 시판 제품 검색 키워드 자동 생성

---

## 3. 추천 기술 스택

### 기본 스택

| 영역 | 권장 기술 |
|---|---|
| 프론트엔드 | Next.js |
| UI | Tailwind CSS |
| DB | Firebase Firestore |
| 인증 | 1차 MVP에서는 간단한 관리자 비밀번호 또는 Firebase Auth |
| AI API | Gemini API 또는 OpenAI API |
| 자동 실행 | Vercel Cron / GitHub Actions / 서버 cron |
| 알림 | Telegram Bot API |
| 배포 | Vercel 또는 Netlify, 추후 Vultr 가능 |

### 우선 추천

사용자가 기존에 Firebase + Next.js 프로젝트 경험이 있으므로 다음 구조를 우선 권장한다.

```text
Next.js + Tailwind CSS + Firebase Firestore + AI API
```

---

## 4. 주요 화면 구성

### 4-1. 대시보드

경로 예시:

```text
/
```

표시 내용:

- 오늘 생성된 아이디어 수
- 저장된 아이디어 수
- 실패 아이디어 수
- 우수 후보 수
- 개발 중 아이디어 수
- 최근 7일 평균 점수
- 영역별 아이디어 분포
- 최근 저장된 아이디어 목록
- 점수가 높은 아이디어 TOP 5

---

### 4-2. 오늘의 아이디어 화면

경로 예시:

```text
/today
```

기능:

- 오늘 생성된 아이디어 카드 표시
- 영역별 탭 표시
- 각 카드에서 평가 가능
- 저장 / 실패 / 발전시키기 버튼
- 상세 보기 버튼

카드에 표시할 정보:

```text
아이디어명
분류
추천 학년
문제 상황
사용 대상
핵심 해결 아이디어
현실적 제작 가능성
특허 가능성 예비 판단
발명대회 적합성
```

---

### 4-3. 아이디어 생성 화면

경로 예시:

```text
/generate
```

기능:

1. 영역 선택
2. 학교급 선택
3. 생성 개수 선택
4. 생성 기준 선택
5. AI 아이디어 생성 요청
6. 생성 결과 저장 전 미리보기
7. 선택 저장

선택 가능한 영역:

```text
생활안전
학교생활
환경·에너지
고령자·장애 보조
반려동물
재난·기후
디지털·AI
의료·건강
교통·이동
가정생활
운동·놀이
학습도구
```

학교급:

```text
초등 저학년
초등 고학년
중학생
고등학생
전체
```

생성 기준:

```text
최근 기사 기반
생활 불편함 기반
학교 현장 문제 기반
제품 리뷰 불만 기반
사회 변화 기반
사용자 입력 불편함 기반
무작위 혼합
```

---

### 4-4. 아이디어 저장소

경로 예시:

```text
/ideas
```

기능:

- 전체 저장 아이디어 목록
- 검색
- 필터
- 정렬
- 상세 보기
- 상태 변경
- 평가 수정
- 발전 요청

검색 필드:

```text
아이디어명
문제 상황
핵심 아이디어
키워드
카테고리
추천 학년
```

필터:

```text
상태: draft / saved / failed / excellent / developing
카테고리
학교급
평균 점수
특허 가능성
제작 가능성
생성일
```

정렬:

```text
최신순
평균 점수 높은순
발명대회 적합성 높은순
특허 가능성 높은순
제작 가능성 높은순
```

---

### 4-5. 실패 목록

경로 예시:

```text
/failures
```

목적:

실패한 아이디어도 삭제하지 않고 저장한다.  
나중에 실패 사유를 분석하여 더 좋은 아이디어 생성 기준으로 활용한다.

표시 정보:

```text
아이디어명
분류
평균 점수
실패 사유
약점
재활용 가능성
생성일
```

실패 사유 예시:

```text
문제가 모호함
기존 제품과 너무 유사함
학생 제작이 어려움
발명대회 주제로 약함
구조가 설명하기 어려움
특허 가능성이 낮음
```

---

### 4-6. 불편함 입력실

경로 예시:

```text
/painpoints
```

사용자가 직접 불편함을 입력하는 공간이다.

예시 입력:

```text
비 오는 날 학생들이 젖은 우산을 들고 들어오면 복도와 교실 바닥이 너무 젖는다.
```

AI 분석 결과:

```text
문제 요약
사용 대상
불편 상황
기존 해결 방법
기존 해결 방법의 한계
발명 아이디어 후보 3~5개
추천 아이디어
검색 키워드
```

이후 사용자는 특정 후보를 선택하여 아이디어 카드로 저장할 수 있어야 한다.

---

### 4-7. 발전 연구실

경로 예시:

```text
/develop/[ideaId]
```

기능:

선택한 아이디어를 더 깊게 발전시킨다.

반드시 포함할 항목:

```text
아이디어명
기존 문제
핵심 아이디어
이상적인 해결방법
현실적인 해결방법
학생 제작용 시제품 구성
작동 원리
준비물
제작 난이도
예상 비용
특허 검색 키워드
기존 수상작 검색 키워드
시판 제품 검색 키워드
차별화 포인트
보완 지도 방향
```

---

## 5. 아이디어 카드 데이터 구조

Firestore 컬렉션명:

```text
ideas
```

문서 필드:

```ts
type Idea = {
  id: string;

  title: string;
  category: string;
  subCategory: string;
  targetSchoolLevel: string;

  problem: string;
  userPainPoint?: string;
  targetUser: string;
  usageSituation: string;

  coreIdea: string;
  idealSolution: string;
  realisticSolution: string;
  prototypePlan: string;
  operatingPrinciple: string;

  expectedMaterials: string[];
  expectedDifficulty: "easy" | "medium" | "hard";
  expectedCostLevel: "low" | "medium" | "high";

  patentPotential: string;
  contestSuitability: string;
  noveltyNote: string;
  similarRiskNote: string;

  sourceBasis: SourceBasis[];
  searchKeywords: SearchKeywords;

  status: "draft" | "saved" | "failed" | "excellent" | "developing";

  scores: IdeaScores;
  averageScore: number;

  failureReason?: string;
  improvementMemo?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

---

## 6. 평가 데이터 구조

Firestore 컬렉션명:

```text
ratings
```

문서 필드:

```ts
type Rating = {
  id: string;
  ideaId: string;

  problemClarity: number;       // 문제의 명확성 1~5
  novelty: number;              // 새로움 1~5
  feasibility: number;          // 학생 제작 가능성 1~5
  contestSuitability: number;   // 발명대회 적합성 1~5
  patentPotential: number;      // 특허 가능성 1~5
  developmentPotential: number; // 발전 가능성 1~5

  averageScore: number;
  memo?: string;

  createdAt: Timestamp;
};
```

평균 계산:

```ts
averageScore =
  (
    problemClarity +
    novelty +
    feasibility +
    contestSuitability +
    patentPotential +
    developmentPotential
  ) / 6;
```

상태 분류 기준:

```text
평균 4.3 이상: excellent
평균 3.5 이상 4.3 미만: saved
평균 3.5 미만: failed
```

---

## 7. 실패 목록 데이터 구조

Firestore 컬렉션명:

```text
failures
```

문서 필드:

```ts
type Failure = {
  id: string;
  ideaId: string;

  title: string;
  category: string;
  averageScore: number;

  failureReason: string;
  weakPoints: string[];
  reusePotential: string;

  createdAt: Timestamp;
};
```

---

## 8. 불편함 입력 데이터 구조

Firestore 컬렉션명:

```text
painpoints
```

문서 필드:

```ts
type Painpoint = {
  id: string;

  userInput: string;
  analyzedProblem: string;
  targetUser: string;
  existingSolutions: string[];
  limitations: string[];

  suggestedIdeas: SuggestedIdea[];

  createdAt: Timestamp;
};
```

---

## 9. 발전 기록 데이터 구조

Firestore 컬렉션명:

```text
developmentLogs
```

문서 필드:

```ts
type DevelopmentLog = {
  id: string;
  ideaId: string;

  version: number;
  originalIdeaSummary: string;

  idealSolution: string;
  realisticSolution: string;
  prototypePlan: string;
  operatingPrinciple: string;

  materials: string[];
  estimatedCost: string;
  difficulty: string;

  patentSearchKeywords: string[];
  contestWinnerSearchKeywords: string[];
  productSearchKeywords: string[];

  differentiationPoints: string[];
  guidanceForStudent: string[];

  createdAt: Timestamp;
};
```

---

## 10. 키워드 구조

```ts
type SearchKeywords = {
  patent: string[];
  contestWinners: string[];
  products: string[];
  general: string[];
  expanded: string[];
};
```

예시:

```json
{
  "patent": ["우산 물받이", "우산 건조 장치", "빗물 회수 우산 거치대"],
  "contestWinners": ["우산 발명품", "빗물 방지 발명", "학교 우산 보관"],
  "products": ["우산 물받이", "우산 건조기", "우산 거치대"],
  "general": ["젖은 우산 복도 물기", "학교 우산 관리 불편"],
  "expanded": ["비오는 날 교실 바닥", "우산 빗물 제거", "학생 우산 보관 문제"]
}
```

---

## 11. AI 아이디어 생성 프롬프트

다음 프롬프트를 서버 API 또는 AI 호출 함수에서 사용한다.

```markdown
너는 초·중·고 학생 발명대회 아이디어 발굴 보조 AI이다.

목표는 학생이 실제로 이해하고 설명할 수 있으며, 발명대회에 출품할 수 있고, 학생 특허 등록 가능성까지 검토할 수 있는 발명 아이디어 초안을 생성하는 것이다.

아이디어는 단순한 상상에서 출발하면 안 된다.
반드시 다음 중 하나 이상의 근거를 바탕으로 한다.

1. 최근 사회 문제
2. 최근 기사에서 드러난 문제
3. 생활 속 불편함
4. 학교 현장에서 반복되는 문제
5. 제품 리뷰나 사용자 후기에서 나타난 불만
6. 고령화, 기후위기, 안전사고, 환경문제 등 사회 변화
7. 기존 제품의 한계
8. 학생이 직접 관찰할 수 있는 문제

각 아이디어는 다음 조건을 만족해야 한다.

1. 초·중·고 학생이 이해하고 설명할 수 있어야 한다.
2. 실제 시제품 제작 가능성이 있어야 한다.
3. 기존 제품을 단순히 조합한 수준이면 안 된다.
4. 해결하려는 문제가 명확해야 한다.
5. 구조와 작동 원리가 설명 가능해야 한다.
6. 특허 검색이 가능하도록 키워드를 제공해야 한다.
7. 이상적인 해결 방법과 현실적인 해결 방법을 구분해야 한다.
8. 발명대회 출품 가능성을 예비 평가해야 한다.
9. 유사 제품이나 특허가 있을 가능성을 함께 표시해야 한다.
10. 법적 특허 가능성을 단정하지 말고 “추가 검토 필요” 수준으로 표현한다.

출력은 반드시 JSON 배열로 한다.
각 아이디어는 다음 필드를 포함한다.

[
  {
    "title": "아이디어명",
    "category": "대분류",
    "subCategory": "세부분류",
    "targetSchoolLevel": "추천 학교급",
    "problem": "해결하려는 문제",
    "targetUser": "사용 대상",
    "usageSituation": "사용 상황",
    "coreIdea": "핵심 아이디어",
    "idealSolution": "이상적인 해결방법",
    "realisticSolution": "현실적인 해결방법",
    "prototypePlan": "학생 제작용 시제품 구성",
    "operatingPrinciple": "작동 원리",
    "expectedMaterials": ["예상 재료1", "예상 재료2"],
    "expectedDifficulty": "easy | medium | hard",
    "expectedCostLevel": "low | medium | high",
    "patentPotential": "특허 가능성 예비 판단",
    "contestSuitability": "발명대회 적합성",
    "noveltyNote": "새로움 판단",
    "similarRiskNote": "유사 가능성 및 추가 검토 필요 사항",
    "sourceBasis": [
      {
        "type": "최근 기사 | 생활 불편함 | 학교 현장 문제 | 제품 리뷰 불만 | 사회 변화",
        "summary": "근거 요약",
        "searchHint": "검색하면 좋을 키워드"
      }
    ],
    "searchKeywords": {
      "patent": ["특허 검색어"],
      "contestWinners": ["기존 수상작 검색어"],
      "products": ["시판 제품 검색어"],
      "general": ["일반 검색어"],
      "expanded": ["확장 검색어"]
    }
  }
]
```

---

## 12. 불편함 분석 프롬프트

```markdown
너는 사용자가 입력한 생활 속 불편함을 발명 아이디어로 바꾸는 발명 코치이다.

사용자의 불편함을 다음 기준으로 분석한다.

1. 문제 상황
2. 실제 사용자
3. 사용 장면
4. 기존 해결 방법
5. 기존 해결 방법의 한계
6. 발명 아이디어 후보 3~5개
7. 가장 추천하는 아이디어
8. 학생 제작 가능성
9. 특허·수상작·제품 검색 키워드

출력은 JSON 형식으로 한다.

{
  "analyzedProblem": "문제 요약",
  "targetUser": "사용 대상",
  "usageSituation": "사용 상황",
  "existingSolutions": ["기존 해결 방법"],
  "limitations": ["기존 해결 방법의 한계"],
  "suggestedIdeas": [
    {
      "title": "아이디어명",
      "coreIdea": "핵심 아이디어",
      "realisticPrototype": "학생 제작용 시제품",
      "reason": "추천 이유",
      "risk": "유사 가능성 또는 한계"
    }
  ],
  "recommendedIdeaTitle": "가장 추천하는 아이디어",
  "searchKeywords": {
    "patent": ["특허 검색어"],
    "contestWinners": ["수상작 검색어"],
    "products": ["제품 검색어"],
    "general": ["일반 검색어"]
  }
}
```

---

## 13. 아이디어 발전 프롬프트

```markdown
너는 초·중·고 학생 발명대회 작품을 지도하는 발명 교육 전문가이다.

선택한 아이디어를 학생 발명대회 출품 가능성이 높아지도록 발전시킨다.

반드시 다음 두 방향을 구분한다.

1. 이상적인 해결방법
   - 기술적 제약을 크게 보지 않고 가장 완성도 높은 형태로 제안한다.
   - 센서, AI, 자동화, 앱 연동, 데이터 분석 등을 포함할 수 있다.

2. 현실적인 해결방법
   - 학생이 실제로 제작 가능한 형태로 제안한다.
   - 3D 프린터, 아두이노, ESP32, 마이크로비트, 목재, 종이, 자석, 고무줄, 레버, 스위치 등으로 구현 가능한 구조를 우선한다.

출력 항목:

{
  "ideaTitle": "아이디어명",
  "problemSummary": "문제 요약",
  "improvedCoreIdea": "개선된 핵심 아이디어",
  "idealSolution": "이상적인 해결방법",
  "realisticSolution": "현실적인 해결방법",
  "prototypePlan": "학생 제작용 시제품 계획",
  "operatingPrinciple": "작동 원리",
  "materials": ["준비물"],
  "estimatedCost": "예상 비용",
  "difficulty": "제작 난이도",
  "patentSearchKeywords": ["특허 검색어"],
  "contestWinnerSearchKeywords": ["기존 수상작 검색어"],
  "productSearchKeywords": ["시판 제품 검색어"],
  "differentiationPoints": ["차별점"],
  "guidanceForStudent": ["학생에게 보완 지도할 내용"]
}
```

---

## 14. 화면별 UI 구성 제안

### 공통 레이아웃

왼쪽 사이드바:

```text
대시보드
오늘의 아이디어
아이디어 생성
아이디어 저장소
우수 후보
실패 목록
불편함 입력실
발전 연구실
설정
```

상단 바:

```text
프로젝트명
오늘 날짜
아이디어 생성 버튼
검색창
```

카드 색상 제안:

```text
draft: 회색
saved: 파란색
excellent: 초록색
developing: 보라색
failed: 붉은색
```

---

## 15. 상태 변경 로직

평가가 입력되면 자동으로 평균을 계산한다.

```ts
function getIdeaStatus(averageScore: number) {
  if (averageScore >= 4.3) return "excellent";
  if (averageScore >= 3.5) return "saved";
  return "failed";
}
```

상태별 처리:

```text
excellent:
- ideas.status = excellent
- 우수 후보 목록에 표시

saved:
- ideas.status = saved
- 저장 목록에 표시

failed:
- ideas.status = failed
- failures 컬렉션에도 기록
- 실패 목록에 표시
```

---

## 16. 텔레그램 연동 계획

### 1차에서는 구현하지 않음

단, 추후 연동 가능하도록 API 구조를 분리한다.

예상 기능:

1. 매일 아침 오늘의 아이디어 3~5개 발송
2. 버튼으로 저장 / 실패 / 발전 요청
3. 우수 후보 주간 요약 발송
4. 사용자가 텔레그램으로 불편함 입력
5. AI가 후보 아이디어를 다시 텔레그램으로 반환

메시지 예시:

```text
🌱 오늘의 발명 아이디어

[생활안전]
아이디어명: 빗물 튐 방지 책가방 커버

문제:
비 오는 날 책가방 아래쪽이 젖고, 교실 바닥에 물이 떨어짐.

핵심 아이디어:
책가방 하단에 흡수·배수 구조를 가진 탈부착 커버 적용

평가:
1점 2점 3점 4점 5점

[저장] [실패] [발전시키기]
```

---

## 17. 자동 생성 스케줄 계획

2단계에서 구현한다.

예시:

```text
매일 오전 7시
영역별 아이디어 5개 생성
- 생활안전 1개
- 학교생활 1개
- 환경·에너지 1개
- 디지털·AI 1개
- 무작위 영역 1개
```

중복 방지:

1. 최근 30일 아이디어 제목 비교
2. 핵심 문제 유사도 비교
3. 동일 키워드 과다 반복 방지
4. 비슷한 아이디어는 생성하지 않고 변형 방향만 제안

---

## 18. 관리자 설정

경로 예시:

```text
/settings
```

설정 항목:

```text
AI API Key
하루 생성 아이디어 개수
기본 학교급
기본 카테고리
평균 점수 저장 기준
우수 후보 기준
텔레그램 Bot Token
텔레그램 Chat ID
자동 생성 시간
```

---

## 19. 품질 기준

생성되는 아이디어는 다음 기준을 만족해야 한다.

### 좋은 아이디어 기준

1. 문제 상황이 구체적이다.
2. 사용자가 명확하다.
3. 사용 장면이 뚜렷하다.
4. 기존 해결 방법의 한계를 설명할 수 있다.
5. 학생이 제작할 수 있는 현실형 시제품이 있다.
6. 구조와 작동 원리를 설명할 수 있다.
7. 특허·수상작·제품 검색 키워드가 있다.
8. 발명대회 보고서로 발전 가능하다.

### 나쁜 아이디어 기준

1. 너무 추상적이다.
2. 단순 앱 아이디어에 그친다.
3. 기존 제품과 거의 같다.
4. 학생 제작이 어렵다.
5. 문제보다 기술이 먼저 나온다.
6. 사용 장면이 불명확하다.
7. “AI가 알아서 해결”처럼 원리가 모호하다.

---

## 20. 초기 샘플 아이디어

개발 중 테스트 데이터로 아래 예시를 넣어도 된다.

### 샘플 1

```json
{
  "title": "젖은 우산 물방울 회수 손잡이",
  "category": "학교생활",
  "subCategory": "우산·비오는 날",
  "targetSchoolLevel": "초등 고학년",
  "problem": "비 오는 날 학생들이 젖은 우산을 들고 교실에 들어오면 복도와 교실 바닥이 젖는다.",
  "targetUser": "초등학생과 교사",
  "usageSituation": "비 오는 날 등교 후 교실 입실 전",
  "coreIdea": "우산 손잡이 아래쪽에 탈부착식 흡수·저장 구조를 달아 우산 끝에서 떨어지는 물을 모은다.",
  "idealSolution": "센서가 우산의 젖음 정도를 감지하고 자동으로 건조 상태를 알려주는 스마트 우산 거치 시스템",
  "realisticSolution": "스펀지 흡수재와 작은 물받이 통, 3D 프린터로 만든 손잡이 결합부를 활용한 탈부착 장치",
  "prototypePlan": "우산 손잡이 하단에 끼우는 컵 형태의 물받이를 제작하고 내부에 흡수재를 넣는다.",
  "operatingPrinciple": "우산 끝에서 흐르는 물이 중력에 의해 아래쪽 물받이로 모이고, 흡수재가 물방울을 머금는다.",
  "expectedMaterials": ["3D 프린터 출력물", "스펀지", "고무링", "소형 플라스틱 컵"],
  "expectedDifficulty": "easy",
  "expectedCostLevel": "low",
  "patentPotential": "우산 물받이 관련 선행기술이 있을 가능성이 있어 구조 차별성 확인 필요",
  "contestSuitability": "학교생활 문제와 직접 연결되어 발명대회 주제로 적합",
  "noveltyNote": "우산꽂이가 아니라 개인 우산 손잡이에 부착하는 방식이라 차별화 가능",
  "similarRiskNote": "우산 물받이, 우산 건조기, 우산 커버류 제품과 유사성 확인 필요"
}
```

### 샘플 2

```json
{
  "title": "급식 줄 간격 알려주는 바닥 신호판",
  "category": "학교생활",
  "subCategory": "급식·질서",
  "targetSchoolLevel": "초등 고학년",
  "problem": "급식 줄을 설 때 학생 간격이 너무 좁거나 줄이 흐트러져 혼잡이 생긴다.",
  "targetUser": "초등학생",
  "usageSituation": "급식실 앞 대기 줄",
  "coreIdea": "바닥에 발 위치와 대기 간격을 알려주는 접이식 신호판을 설치한다.",
  "idealSolution": "센서가 학생 간격을 감지해 LED로 적정 간격을 알려주는 스마트 대기 시스템",
  "realisticSolution": "접이식 바닥판, 색상 표시, 발 모양 마커를 이용한 무전원 질서 유도 장치",
  "prototypePlan": "얇은 플라스틱 판이나 종이 보드에 발 위치 표시를 만들고 접이식으로 연결한다.",
  "operatingPrinciple": "시각적 위치 표시가 학생의 대기 위치를 자연스럽게 유도한다.",
  "expectedMaterials": ["EVA 보드", "스티커", "벨크로", "접이식 연결테이프"],
  "expectedDifficulty": "easy",
  "expectedCostLevel": "low",
  "patentPotential": "바닥 유도 표시 장치 관련 선행기술 확인 필요",
  "contestSuitability": "학교 문제 해결형 발명으로 적합",
  "noveltyNote": "전기 장치 없이 접이식·이동식으로 학교 상황에 맞춘 점이 차별점",
  "similarRiskNote": "거리두기 바닥 스티커, 줄서기 매트와 유사성 확인 필요"
}
```

---

## 21. 프로젝트 폴더 구조 제안

```text
invention-seed-lab/
├─ app/
│  ├─ page.tsx
│  ├─ today/
│  │  └─ page.tsx
│  ├─ generate/
│  │  └─ page.tsx
│  ├─ ideas/
│  │  ├─ page.tsx
│  │  └─ [ideaId]/
│  │     └─ page.tsx
│  ├─ failures/
│  │  └─ page.tsx
│  ├─ painpoints/
│  │  └─ page.tsx
│  ├─ develop/
│  │  └─ [ideaId]/
│  │     └─ page.tsx
│  └─ settings/
│     └─ page.tsx
├─ components/
│  ├─ IdeaCard.tsx
│  ├─ RatingPanel.tsx
│  ├─ StatusBadge.tsx
│  ├─ CategoryFilter.tsx
│  └─ Sidebar.tsx
├─ lib/
│  ├─ firebase.ts
│  ├─ ai.ts
│  ├─ ideas.ts
│  ├─ ratings.ts
│  ├─ painpoints.ts
│  └─ telegram.ts
├─ types/
│  └─ idea.ts
├─ prompts/
│  ├─ generateIdeaPrompt.md
│  ├─ painpointPrompt.md
│  └─ developIdeaPrompt.md
├─ README.md
└─ .env.local.example
```

---

## 22. 환경 변수 예시

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

AI_PROVIDER=gemini
GEMINI_API_KEY=
OPENAI_API_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## 23. README에 포함할 내용

README에는 다음을 포함한다.

```text
프로젝트 소개
주요 기능
설치 방법
환경 변수 설정
Firebase 설정 방법
AI API 설정 방법
로컬 실행 방법
배포 방법
데이터 구조
향후 개발 계획
```

---

## 24. Antigravity 작업 지시

Antigravity는 다음 순서로 작업한다.

### Step 1. 프로젝트 생성

```text
Next.js + TypeScript + Tailwind CSS 프로젝트 생성
```

### Step 2. 기본 레이아웃 생성

```text
Sidebar
Header
Dashboard
공통 카드 UI
```

### Step 3. 타입 정의

```text
types/idea.ts 생성
Idea, Rating, Failure, Painpoint, DevelopmentLog 타입 정의
```

### Step 4. Firebase 연결

```text
lib/firebase.ts 생성
Firestore 연결
환경 변수 기반 설정
```

### Step 5. 샘플 데이터 표시

```text
초기에는 AI API 없이 샘플 아이디어 2개를 화면에 표시
```

### Step 6. 평가 기능

```text
RatingPanel 구현
6개 항목 1~5점 입력
평균 계산
상태 자동 분류
```

### Step 7. Firestore 저장

```text
ideas 컬렉션 저장
ratings 컬렉션 저장
failed인 경우 failures 컬렉션 저장
```

### Step 8. 저장소·실패 목록 구현

```text
/ideas
/failures
검색·필터·정렬 기능
```

### Step 9. AI 생성 API 구현

```text
/api/generate-ideas
아이디어 생성 프롬프트 연결
JSON 결과 파싱
생성 결과 화면 표시
```

### Step 10. 불편함 입력 기능

```text
/painpoints
/api/analyze-painpoint
불편함 분석 후 아이디어 후보 생성
선택한 후보를 ideas에 저장
```

### Step 11. 발전 기능

```text
/develop/[ideaId]
/api/develop-idea
발전 결과 developmentLogs에 저장
```

### Step 12. 문서화

```text
README.md 작성
사용법 정리
다음 단계 TODO 정리
```

---

## 25. 주의사항

1. 처음부터 텔레그램, 자동 크론, 외부 검색까지 모두 구현하지 않는다.
2. 1차 목표는 웹앱에서 수동 생성·평가·저장·발전이 되는 것이다.
3. AI 결과는 항상 JSON 파싱 오류 가능성이 있으므로 예외 처리한다.
4. 특허 가능성은 단정하지 않는다.
5. “특허 가능” 대신 “선행기술 검토 필요”, “유사 가능성 확인 필요”라고 표현한다.
6. 학생 발명대회용이므로 제작 가능성과 설명 가능성을 중요하게 본다.
7. 아이디어가 기존 제품과 유사할 수 있으므로 검색 키워드를 반드시 제공한다.
8. 실패 목록은 삭제가 아니라 학습 데이터로 보관한다.
9. 사용자가 입력한 불편함은 원문과 분석 결과를 모두 저장한다.
10. 추후 기존 특허·수상작·시판 제품 유사도 검토 기능과 연결될 수 있게 키워드 구조를 유지한다.

---

## 26. 최종 목표

최종적으로 이 웹앱은 다음 역할을 해야 한다.

```text
1. 매일 새로운 발명 아이디어를 제안하는 발명 주제 생성기
2. 교사가 아이디어를 평가하는 심사 보조 도구
3. 좋은 아이디어를 누적하는 아이디어 저장소
4. 약한 아이디어를 버리지 않고 분석하는 실패 데이터베이스
5. 학생 발명대회 주제를 발전시키는 발명 코치
6. 특허·수상작·제품 검색으로 이어지는 사전 검토 플랫폼
```

---

## 27. 다음 단계 TODO

1. MVP 웹앱 생성
2. Firebase 프로젝트 연결
3. 샘플 아이디어 카드 구현
4. 평가 패널 구현
5. 저장·실패 분류 구현
6. AI 생성 API 연결
7. 불편함 입력 분석 구현
8. 발전 연구실 구현
9. 텔레그램 연동 설계
10. 자동 생성 스케줄러 구현
11. 기존 발명품 유사도 검토 기능과 연결

---

## 28. 개발 완료 기준

1차 MVP 완료 기준:

- [ ] 웹페이지 접속 가능
- [ ] 아이디어 생성 화면이 있음
- [ ] 샘플 아이디어 카드가 표시됨
- [ ] AI API로 아이디어 생성 가능
- [ ] 사용자가 6개 항목 점수 입력 가능
- [ ] 평균 점수가 자동 계산됨
- [ ] 평균에 따라 saved / failed / excellent 상태가 자동 지정됨
- [ ] Firestore에 ideas 저장됨
- [ ] Firestore에 ratings 저장됨
- [ ] failed 아이디어는 failures에도 저장됨
- [ ] 저장소에서 아이디어 검색 가능
- [ ] 실패 목록에서 실패 아이디어 확인 가능
- [ ] 불편함 입력 후 아이디어 후보 생성 가능
- [ ] 발전시키기 결과가 표시되고 저장됨
- [ ] README에 설치·실행 방법이 정리됨

---

끝.
