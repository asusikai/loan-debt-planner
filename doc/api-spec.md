# API 명세

## 1. 개요
- 목적: 상환 전략 시뮬레이션 및 결과 조회를 위한 내부 API 정의
- 기준: REST + JSON
- 버전: v1

## 2. 공통 규칙
- Base URL: `/api/v1`
- Content-Type: `application/json`
- 금액 단위: KRW(정수)
- 날짜 포맷: ISO 8601

## 3. 엔드포인트

### 3.1 시뮬레이션 실행
- `POST /api/v1/simulations`

요청 예시:
```json
{
  "monthlyBudget": 700000,
  "extraPayment": 100000,
  "debts": [
    {
      "name": "신용대출A",
      "balance": 5000000,
      "annualRate": 0.082,
      "minimumPayment": 200000,
      "prepaymentFeeRate": 0.01
    }
  ]
}
```

응답 예시:
```json
{
  "simulationId": "sim_20260210_001",
  "generatedAt": "2026-02-10T12:00:00Z",
  "results": {
    "avalanche": {
      "totalInterest": 742000,
      "monthsToPayoff": 24,
      "payoffDate": "2028-02-01"
    },
    "snowball": {
      "totalInterest": 801000,
      "monthsToPayoff": 25,
      "payoffDate": "2028-03-01"
    }
  }
}
```

오류 코드:
- `400`: 입력 검증 실패
- `422`: 상환 불가능 시나리오(월 예산 부족)
- `500`: 내부 계산 오류

### 3.2 시뮬레이션 결과 조회
- `GET /api/v1/simulations/{simulationId}`

응답 예시:
```json
{
  "simulationId": "sim_20260210_001",
  "results": {
    "avalanche": {
      "totalInterest": 742000,
      "monthsToPayoff": 24,
      "payoffDate": "2028-02-01"
    },
    "snowball": {
      "totalInterest": 801000,
      "monthsToPayoff": 25,
      "payoffDate": "2028-03-01"
    }
  },
  "monthlyPlans": {
    "avalanche": [],
    "snowball": []
  }
}
```

오류 코드:
- `404`: 시뮬레이션 ID 없음
- `500`: 내부 조회 오류

### 3.3 상태 확인
- `GET /api/v1/health`

응답 예시:
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T12:00:00Z"
}
```
