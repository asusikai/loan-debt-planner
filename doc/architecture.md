# 아키텍처 문서

## 1. 아키텍처 개요
- 유형: 단일 웹 애플리케이션(모놀리식), 클라이언트 중심 계산
- 목표: 빠른 입력, 투명한 계산, 결과 비교 중심 UX
- 제약: 외부 금융 API 미사용

## 2. 기술 스택
- Frontend/App: Next.js (App Router) + React + TypeScript
- 상태 관리: React state + 필요 시 Zustand
- 입력 검증: Zod
- 테스트: Vitest, Playwright(선택)

## 3. 논리 구조

### 3.1 계층
1. Presentation Layer
   - 페이지, 폼, 결과 카드, 월별 상환표 렌더링
2. Application Layer
   - 사용자 입력을 표준 모델로 변환
   - 전략 실행 오케스트레이션
3. Domain Layer
   - 상환 시뮬레이션 엔진(순수 함수)
   - 전략별 정렬/배분 로직
4. Infrastructure Layer
   - LocalStorage 저장/복원(선택)

### 3.2 모듈 제안
- `src/features/repayment/`: 화면 조립 및 유스케이스
- `src/lib/repayment/engine.ts`: 월별 상환 계산 엔진
- `src/lib/repayment/strategies.ts`: Avalanche/Snowball 우선순위
- `src/lib/validation/repayment-schema.ts`: 입력 유효성 검증
- `src/types/`: Debt, Scenario, SimulationResult 등 타입

## 4. 데이터 흐름
1. 사용자가 채무/예산 입력
2. Validation Layer에서 입력 검증
3. Application Layer가 전략별 시뮬레이션 요청
4. Domain Engine이 월 단위 계산 수행
5. 결과를 UI에 비교 형태로 표시

## 5. 계산 원칙
- 금액은 정수 단위(원)로 처리
- 월 이자는 고정된 정책으로 계산(연이율/12)
- 동일 입력 시 동일 결과 보장(결정적 계산)
- 수수료는 조기상환 시 순효과(절감이자 - 수수료) 기준 반영

## 6. 확장 포인트
- 전략 추가(예: 혼합 전략)
- 저장소 계층 교체(LocalStorage -> DB)
- 사용자 계정/동기화 기능 확장
