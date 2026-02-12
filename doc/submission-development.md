# DebtPilot 개발문서 (제출용)

## 1. 구현 개요
- 프레임워크: Next.js 15 (App Router)
- 언어: TypeScript
- 핵심 라이브러리: React 19, Zod
- 테스트: Vitest, Playwright

## 2. 실제 코드 구조

### 2.1 UI/페이지
- `src/app/page.tsx`: 전체 화면 상태/이벤트 오케스트레이션
- `src/app/components/debt-form.tsx`: 채무 입력/수정 폼
- `src/app/components/debt-list.tsx`: 채무 목록/삭제/수정 진입
- `src/app/components/strategy-comparison.tsx`: 전략 비교 카드
- `src/app/components/payment-table.tsx`: 월별 상환표
- `src/components/common/`: ErrorBoundary, ErrorModal, Toast

### 2.2 도메인
- `src/lib/repayment/engine.ts`: 전략별 상환 시뮬레이션 핵심 엔진
- `src/lib/repayment/required-payment.ts`: 상환 방식별 필수 납입 계산
- `src/lib/repayment/sort-provider.ts`: 전략 정렬 규칙(0% 금리 후순위, 만기 보조 정렬)
- `src/lib/repayment/recommendation.ts`: 총이자 기준 추천 전략 산출

### 2.3 검증/저장
- `src/lib/validation/debt-form-schema.ts`: 폼 입력 검증
- `src/lib/validation/repayment-schema.ts`: API 입력 검증
- `src/hooks/use-debt-storage.ts`: 채무 로컬 저장/복원
- `src/hooks/use-budget-storage.ts`: 추가 상환 로컬 저장/복원

### 2.4 API
- `src/app/api/v1/simulations/route.ts`: 시뮬레이션 실행
- `src/app/api/v1/health/route.ts`: 헬스체크

## 3. 핵심 구현 상세

### 3.1 시뮬레이션 엔진
- 월 루프 기반으로 필수 납입 -> 추가 상환 순서로 계산
- 상환 방식(`equalInstallment`, `equalPrincipal`, `bullet`)별 필수 납입액 계산
- 중도상환수수료를 추가 상환 시점에 별도 집계
- 최종 결과: `totalInterest`, `totalFeesPaid`, `netSavings`, `monthsToPayoff`, `payoffDate`, `monthlyPlans`

### 3.2 전략 정렬
- Avalanche: 고금리 우선, 동률 시 만기/잔액 보조 정렬
- Snowball: 소액잔액 우선, 동률 시 만기/금리 보조 정렬
- 0% 금리 채무는 Avalanche에서 후순위 처리

### 3.3 입력 검증
- 채무명 필수, 잔액 1 이상, 금리 0 이상
- bullet 방식은 만기 필수, 거치 기간 불가
- 거치 기간은 만기보다 작아야 함
- 추가 상환 금액은 0 이상

### 3.4 예외 처리
- UI: 토스트 + 에러 모달 + ErrorBoundary
- 저장소 손상: 경고 후 기본 상태로 복구
- 계산 불가 시나리오: 엔진 예외를 통해 실패 감지

## 4. 개선 과정

### 4.1 주요 개선 이력
- 수수료 지표 확장(`totalFeesPaid`, `netSavings`)
- 정렬 책임 분리(`SortProvider` 도입)
- 장기 시나리오 회귀 테스트 강화
- 훅 의존성 정비로 재실행 안정성 강화

### 4.2 트레이드오프
- 빠른 구현을 위해 인증/DB 영속화는 제외
- 결과 재조회 API보다 계산 정확성과 테스트 범위를 우선

## 5. 테스트 및 검증

### 5.1 테스트 구성
- 단위 테스트: `src/lib/repayment/*.test.ts`, `src/utils/*.test.ts`
- 회귀 테스트: `src/lib/repayment/engine-regression.test.ts`
- E2E 테스트: `tests/e2e/full-flow.spec.ts`

### 5.2 검증 범위
- 상환 방식별 계산 정합성
- 전략별 우선순위 차이
- 수수료 반영/면제 경계
- 로컬 저장소 손상 복구
- 상태 초기화 및 핵심 사용자 플로우

## 6. 실행 방법
- `pnpm install`
- `pnpm dev`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## 7. 한계 및 다음 단계
- 현재 결과 영속 저장 및 조회 API 미제공
- 계정/동기화 부재로 단일 브라우저 기반 사용
- 향후 개선: 결과 저장, 사용자별 시나리오 관리, 전략 설명 리포트 강화

## 8. 평가 기준 대응 (결과물/개선/맥락)

| 평가 역량 | 배점 | 대응 전략 | 코드/문서 증빙 |
|---|---:|---|---|
| 결과물 판단력 | 25 | 핵심 계산 정확성 + 구조 분리 + 테스트 검증 | `src/lib/repayment/engine.ts`, `src/lib/repayment/*.test.ts` |
| 반복적 개선 능력 | 20 | 개선 로그 기반 단계적 고도화 | `doc/improvement-log.md` |
| 맥락 관리 능력 | 15 | README/설계/요구사항/API 문서 동기화 | `README.md`, `doc/*.md` |

### 8.1 결과물 판단력 (25점) 세부 대응

기능 정확성 (10점)
- 상환 방식별 계산 분기(`equalInstallment`, `equalPrincipal`, `bullet`)
- 수수료 반영(`totalFeesPaid`) 및 순절감액(`netSavings`) 계산
- 장기 미완납 방지 안전장치(`MAX_MONTHS = 1200`)

코드/구조 품질 (8점)
- 엔진/정렬/검증/저장 책임 분리
- 정렬 로직을 `SortProvider`로 분리해 테스트 가능한 구조 확보

AI 결과물 검증 (7점)
- AI 제안 반영 전 테스트 우선 검증
- 충돌 제안은 수정 후 회귀 테스트로 재검증
- 근거 문서: `doc/ai-collaboration-log.md`

### 8.2 반복적 개선 능력 (20점) 세부 대응
- 단계별 개선 기록: `doc/improvement-log.md`
- 우선순위: 계산 정합성 -> 회귀 방지 -> UX 안정화 -> 문서 정합화
- 트러블슈팅: 수수료 회계 분리, 정렬 책임 분리, 훅 참조 안정화

### 8.3 맥락 관리 능력 (15점) 세부 대응
- 실행/검증 절차는 `README.md`에 단일 기준으로 유지
- 요구사항/아키텍처/API/문제정의 문서를 코드 구조 기준으로 재정렬
- 추적성 문서로 요구사항-구현-테스트 연결 유지: `doc/traceability-matrix.md`

## 9. 가산점 대응 현황

| 항목 | 배점 | 현황 | 근거 |
|---|---:|---|---|
| 배포 완료 | +2 | 미확인(별도 진행 필요) | `doc/vercel-deployment.md` |
| 테스트 코드 작성 | +2 | 충족 | `src/lib/repayment/*.test.ts`, `tests/e2e/full-flow.spec.ts` |
| UX/UI 디자인 | +1 | 일부 반영 | `src/app/components/`, `src/components/common/` |
| 독창 기능 구현 | +2 | 반영(수수료+순절감액 비교) | `src/lib/repayment/engine.ts` |
| 완성도 높은 문서화 | +1 | 반영 | `README.md`, `doc/*.md` |

## 10. 즉시 탈락 사유 방지 체크리스트
- [x] 기획서 제출 파일 분리 완료 (`doc/submission-planning.md`)
- [x] 개발문서 제출 파일 분리 완료 (`doc/submission-development.md`)
- [x] 프로토타입 실행 방법 README 명시
- [x] 주제 연관성 유지(대출/빚 상환 전략)
- [x] 핵심 계산 로직 테스트 코드 포함
