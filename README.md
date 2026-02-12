# DebtPilot

다중 채무를 가진 사용자가 상환 전략(Avalanche/Snowball)을 비교하고,
수수료와 만기 조건까지 고려해 실질적인 상환 계획을 확인하는 웹앱입니다.

핵심 가치는 다음과 같습니다.

- 전략별 총이자, 완납 기간, 순절감액을 한 번에 비교
- 월별 상환표를 통해 실행 가능한 납입 계획 확인
- 입력 검증/오류 복구/회귀 테스트 기반의 신뢰 가능한 계산 결과 제공

## 기술 스택

- Next.js 15 (App Router)
- React 19 + TypeScript 5
- Zod (입력 검증)
- Vitest (단위 테스트)
- Playwright (E2E 테스트)

## 시작하기

### 사전 요구사항

- Node.js 20 이상
- pnpm 9 이상

### 로컬 실행

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

### 검증 및 빌드

```bash
pnpm typecheck
pnpm test
pnpm build
```

## 스크립트

- `pnpm dev`: 개발 서버
- `pnpm build`: 프로덕션 빌드
- `pnpm start`: 프로덕션 서버
- `pnpm lint`: ESLint 실행
- `pnpm typecheck`: 타입 체크
- `pnpm test`: 단위 테스트
- `pnpm test:watch`: 단위 테스트 watch
- `pnpm test:coverage`: 테스트 커버리지
- `pnpm test:e2e`: Playwright E2E

## 단일 테스트 실행

- 파일 단위: `pnpm vitest run src/lib/repayment/engine.test.ts`
- 테스트명 단위: `pnpm vitest run -t "single debt should be payable"`

## 문서

- 문제 정의: `doc/problem-definition.md`
- 서비스 아이디어: `doc/loan-debt-planner-idea.md`
- 요구사항 정의: `doc/requirements.md`
- 아키텍처: `doc/architecture.md`
- API 명세: `doc/api-spec.md`
- DB 설계: `doc/db-design.md`
- 에러 정책: `doc/error-policy.md`
- Vercel 배포 가이드: `doc/vercel-deployment.md`

### 내부 고도화 문서

- 개선 로그: `doc/improvement-log.md`
- AI 협업 로그: `doc/ai-collaboration-log.md`
- 추적성 매트릭스: `doc/traceability-matrix.md`

## 핵심 엔진 동작 요약

- 수수료 반영: 추가 상환 시 수수료(`prepaymentFeeRate`, `feeExemptionMonths`)를 별도 집계하여 `totalFeesPaid`, `netSavings` 산출
- 전략 정렬: `SortProvider`를 통해 Avalanche/Snowball 정렬과 0% 금리/만기 보조 규칙 적용
- 정밀도/종료: 화폐 연산 유틸 기반 정밀도 관리와 최종 회차 잔액 0원 보정, 조기 종료 최적화 적용

## 배포

- 권장 배포 플랫폼: Vercel
- 기본 배포 절차
  1. 저장소 연결 후 프레임워크를 Next.js로 선택
  2. Install Command: `pnpm install --frozen-lockfile`
  3. Build Command: `pnpm build`
  4. Output Directory는 비워두고 Next.js 기본값 사용
