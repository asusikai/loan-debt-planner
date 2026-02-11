# Traceability Matrix

요구사항-구현-테스트 간 추적성 확보를 위한 매트릭스 문서

| ID | 요구사항 | 구현 파일/함수 | 테스트 케이스 | 상태 |
| --- | --- | --- | --- | --- |
| REQ-01 | 중도상환수수료 계산 및 순절감액 반영 | `src/lib/repayment/engine.ts` `simulateStrategy` | `engine.test.ts` 수수료/경계/음수 순절감 케이스 | 구현 완료 |
| REQ-02 | 0% 금리 후순위 + 만기 보조 정렬 | `src/lib/repayment/sort-provider.ts` `rankDebtsByStrategy` | `sort-provider.test.ts` 정렬 안정성 케이스 | 구현 완료 |
| REQ-03 | 월말 잔액 정밀도와 종료 조건 최적화 | `src/lib/repayment/engine.ts` 루프 종료/잔액 보정 | `engine.test.ts` 최종 회차 종료 케이스 | 구현 완료 |
