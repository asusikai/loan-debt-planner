# 아키텍처 문서 (코드베이스 기준)

## 1. 아키텍처 개요
- 유형: Next.js App Router 기반 단일 웹앱
- 계산 방식: 클라이언트 중심 계산 + 내부 API(Route Handler) 병행
- 목표: 입력 즉시 전략 비교와 월별 상환 계획 제공

## 2. 기술 스택
- Frontend/App: Next.js 15 + React 19 + TypeScript 5
- 상태 관리: React state + 커스텀 훅(`src/hooks/`)
- 검증: Zod(`src/lib/validation/`)
- 테스트: Vitest(단위/회귀), Playwright(E2E)

## 3. 실제 모듈 구조

### 3.1 Presentation
- `src/app/page.tsx`: 메인 오케스트레이션
- `src/app/components/`: 입력 폼/리스트/결과 카드/월별표
- `src/components/common/`: ErrorBoundary, ErrorModal, Toast

### 3.2 Domain
- `src/lib/repayment/engine.ts`: 전략 시뮬레이션 핵심 엔진
- `src/lib/repayment/required-payment.ts`: 월 필수 납입액 계산
- `src/lib/repayment/sort-provider.ts`: 전략별 정렬 규칙
- `src/lib/repayment/recommendation.ts`: 추천 전략 산출

### 3.3 Validation
- `src/lib/validation/debt-form-schema.ts`: UI 폼 입력 검증
- `src/lib/validation/repayment-schema.ts`: API 입력 검증
- `src/lib/validation/budget-schema.ts`: 추가 상환 입력 검증

### 3.4 Persistence
- `src/hooks/use-debt-storage.ts`: 채무 로컬 저장/복원
- `src/hooks/use-budget-storage.ts`: 추가 상환 로컬 저장/복원

### 3.5 API
- `src/app/api/v1/simulations/route.ts`: 전략 계산 API
- `src/app/api/v1/health/route.ts`: 상태 확인 API

## 4. 데이터 흐름
1. 사용자가 채무/추가 상환 입력
2. 폼 스키마 검증 후 상태 반영
3. `simulateStrategy`를 Avalanche/Snowball로 실행
4. 결과(`totalInterest`, `totalFeesPaid`, `netSavings`, `monthsToPayoff`, `monthlyPlans`) 생성
5. 전략 비교 카드와 월별표 렌더링

## 5. 계산 원칙
- 금액은 KRW 정수로 처리(`toKrw`)
- 이자 계산은 월 단위(연이율/12)
- 상환 방식별 필수 납입액 계산 후 남은 예산으로 추가 상환 배분
- 추가 상환 시 수수료를 별도 집계하고 순절감액 계산에 반영
- 최대 1200개월 안전 제한, 미완납 시 `UNPAYOFFABLE_SCENARIO` 예외

## 6. 테스트 전략
- 단위: 엔진/정렬/유틸 함수 정확성
- 회귀: 시드 기반 매트릭스 테스트로 장기 안정성 검증
- E2E: 사용자 핵심 플로우(입력-계산-결과) 검증

## 7. 확장 포인트
- 결과 영속 저장 및 조회 API 추가
- 계정 기반 시나리오 동기화
- 전략 설명형 리포트(왜 이 전략이 유리한지) 강화
