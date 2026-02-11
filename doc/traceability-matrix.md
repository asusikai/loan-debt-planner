# Traceability Matrix

요구사항-구현-테스트 간 추적성 확보를 위한 매트릭스 문서

| ID | 요구사항 | 구현 파일/함수 | 테스트 케이스 | 상태 |
| --- | --- | --- | --- | --- |
| REQ-01 | 중도상환수수료 계산 및 순절감액 반영 | `src/lib/repayment/engine.ts` `simulateStrategy` / `simulateStrategyCore` | `engine.test.ts` 수수료/경계/음수 순절감 케이스 | 구현 완료 |
| REQ-02 | 0% 금리 후순위 + 만기 보조 정렬 | `src/lib/repayment/sort-provider.ts` `rankDebtsByStrategy` `compareMaturity` | `sort-provider.test.ts` 정렬 안정성 케이스 | 구현 완료 |
| REQ-03 | 월말 잔액 정밀도와 종료 조건 최적화 | `src/lib/repayment/engine.ts` 월 루프 종료 조건 및 잔액 보정 분기 | `engine.test.ts` 최종 회차 종료 케이스 | 구현 완료 |

## 테스트 케이스 매핑

- `src/lib/repayment/engine.test.ts`
  - `applies prepayment fee and reflects it in net savings`
  - `applies fee right before exemption ends and removes it after exemption`
  - `can return negative net savings when fee outweighs interest savings`
  - `ends on exact payoff month without trailing plan rows`
- `src/lib/repayment/sort-provider.test.ts`
  - `uses maturity as tie-breaker when avalanche rates are equal`
  - `moves zero-rate debts to the end for avalanche`
- `src/lib/repayment/engine-regression.test.ts`
  - `stays stable for seed=..., strategy=...` 매트릭스 케이스

## 로그 문서 교차 참조

- 개선 로그: `doc/improvement-log.md`
  - 계산 정합성, 우선순위 조정 배경, 기술적 통찰 반영 여부 확인
- AI 협업 로그: `doc/ai-collaboration-log.md`
  - 제안 검증/수정 근거와 테스트 확장 이력 반영 여부 확인
