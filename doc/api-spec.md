# API 명세 (현재 구현 기준)

## 1. 개요
- 목적: 내부 시뮬레이션 실행 및 헬스체크
- 기준: REST + JSON
- 버전: v1

## 2. 공통 규칙
- Base URL: `/api/v1`
- Content-Type: `application/json`
- 금액 단위: KRW 정수

## 3. 엔드포인트

### 3.1 시뮬레이션 실행
- `POST /api/v1/simulations`

요청 스키마
```json
{
  "extraPayment": 100000,
  "debts": [
    {
      "name": "신용대출A",
      "balance": 5000000,
      "annualRate": 0.082,
      "repaymentType": "equalInstallment",
      "prepaymentFeeRate": 0.01,
      "feeExemptionMonths": 12,
      "maturityMonths": 24,
      "graceMonths": 0
    }
  ]
}
```

응답 예시
```json
{
  "simulationId": "sim_1739352800000",
  "generatedAt": "2026-02-12T13:00:00.000Z",
  "results": {
    "avalanche": {
      "totalInterest": 742000,
      "monthsToPayoff": 24
    },
    "snowball": {
      "totalInterest": 801000,
      "monthsToPayoff": 25
    }
  }
}
```

오류 응답 예시
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "..."
  }
}
```

상태 코드
- `200`: 성공
- `400`: 입력 검증 실패 또는 계산 실패

참고
- 현재 구현은 결과 저장/재조회(`GET /simulations/{id}`)를 제공하지 않는다.
- API 응답에는 `payoffDate`, `monthlyPlans`, `totalFeesPaid`, `netSavings`가 포함되지 않는다.

### 3.2 상태 확인
- `GET /api/v1/health`

응답 예시
```json
{
  "status": "ok",
  "timestamp": "2026-02-12T13:00:00.000Z"
}
```
