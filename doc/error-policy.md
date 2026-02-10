# 에러 정책

## 1. 목적
- 사용자에게 이해 가능한 오류 메시지를 제공하고,
- 개발자가 추적 가능한 형태로 오류를 표준화한다.

## 2. 에러 분류
1. Validation Error
   - 입력값 누락, 음수, 범위 초과
2. Business Rule Error
   - 월 상환 가능 금액 부족 등 도메인 규칙 위반
3. Not Found Error
   - 존재하지 않는 시뮬레이션 조회
4. Internal Error
   - 계산 로직 예외, 저장/조회 실패

## 3. 응답 포맷
```json
{
  "error": {
    "code": "BUDGET_BELOW_MINIMUM",
    "message": "월 상환 가능 금액이 최소납입액 합계보다 작습니다.",
    "details": {
      "monthlyBudget": 500000,
      "minimumRequired": 620000
    },
    "requestId": "req_20260210_001"
  }
}
```

## 4. HTTP 상태 코드 매핑
- `400 Bad Request`: 입력 형식/필수값 오류
- `404 Not Found`: 리소스 없음
- `422 Unprocessable Entity`: 비즈니스 규칙 위반
- `500 Internal Server Error`: 서버 내부 오류

## 5. 도메인 에러 코드
- `INVALID_INPUT`
- `MISSING_REQUIRED_FIELD`
- `BUDGET_BELOW_MINIMUM`
- `UNPAYOFFABLE_SCENARIO`
- `SIMULATION_NOT_FOUND`
- `INTERNAL_CALCULATION_ERROR`

## 6. 메시지 정책
- 사용자 메시지는 원인 + 조치 방법 포함
  - 예: "월 상환 가능 금액을 최소 620,000원 이상으로 설정해 주세요."
- 개발자 로그는 stack trace 포함 가능, 사용자 응답에는 내부 구현 정보 미노출

## 7. 로깅 정책
- 공통 필드: `timestamp`, `level`, `code`, `requestId`, `path`
- 민감 정보(개인식별정보, 전체 금융 데이터)는 마스킹 처리
- `500` 발생 시 오류 로그 필수 기록

## 8. 재시도 정책
- Validation/Business Rule 오류: 재시도 금지, 입력 수정 유도
- Internal 오류: 사용자에게 잠시 후 재시도 안내
