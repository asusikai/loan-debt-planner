# DebtPilot

다중 채무를 가진 사회초년생을 위한 상환 전략 비교 웹앱입니다.

## 기술 스택

- Next.js (App Router)
- React + TypeScript
- Zod
- Vitest
- Playwright

## 시작하기

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

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
