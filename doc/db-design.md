# DB 설계

## 1. 설계 원칙
- MVP 기준: 인증 없이 단일 사용자 흐름도 지원 가능
- 확장 기준: 다중 사용자/시나리오 저장 지원 가능
- 금액 필드: 정수(KRW) 사용

## 2. 권장 DB
- PostgreSQL (운영 확장성)
- 로컬 MVP는 SQLite로 대체 가능

## 3. ERD 개요
- users 1:N scenarios
- scenarios 1:N debts
- scenarios 1:N simulation_results
- simulation_results 1:N monthly_plans

## 4. 테이블 정의

### 4.1 users
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 사용자 식별자 |
| email | varchar(255) | UNIQUE, NULL 가능 | 로그인 확장 대비 |
| created_at | timestamptz | NOT NULL | 생성 시각 |

### 4.2 scenarios
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 시나리오 ID |
| user_id | uuid | FK(users.id) | 소유 사용자 |
| title | varchar(100) | NOT NULL | 시나리오 이름 |
| monthly_budget | integer | NOT NULL, CHECK >= 0 | 월 상환 예산 |
| extra_payment | integer | NOT NULL, CHECK >= 0 | 추가 상환 금액 |
| created_at | timestamptz | NOT NULL | 생성 시각 |
| updated_at | timestamptz | NOT NULL | 수정 시각 |

### 4.3 debts
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 채무 ID |
| scenario_id | uuid | FK(scenarios.id) | 소속 시나리오 |
| name | varchar(100) | NOT NULL | 채무명 |
| balance | integer | NOT NULL, CHECK >= 0 | 잔액 |
| annual_rate | numeric(6,5) | NOT NULL, CHECK >= 0 | 연이율(0~1) |
| minimum_payment | integer | NOT NULL, CHECK >= 0 | 최소납입액 |
| prepayment_fee_rate | numeric(6,5) | NOT NULL DEFAULT 0 | 중도상환수수료율 |
| maturity_months | integer | NULL 가능, CHECK > 0 | 만기까지 남은 개월 수 |

### 4.4 simulation_results
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 결과 ID |
| scenario_id | uuid | FK(scenarios.id) | 시나리오 참조 |
| strategy | varchar(20) | NOT NULL | avalanche/snowball |
| total_interest | integer | NOT NULL, CHECK >= 0 | 총이자 |
| months_to_payoff | integer | NOT NULL, CHECK > 0 | 완납 개월 수 |
| payoff_date | date | NOT NULL | 완납 예상일 |
| created_at | timestamptz | NOT NULL | 계산 시각 |

### 4.5 monthly_plans
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 월별 계획 ID |
| simulation_result_id | uuid | FK(simulation_results.id) | 결과 참조 |
| month_index | integer | NOT NULL, CHECK > 0 | 1부터 시작 |
| debt_id | uuid | FK(debts.id) | 대상 채무 |
| payment_amount | integer | NOT NULL, CHECK >= 0 | 납입액 |
| interest_amount | integer | NOT NULL, CHECK >= 0 | 이자액 |
| principal_amount | integer | NOT NULL, CHECK >= 0 | 원금상환액 |
| remaining_balance | integer | NOT NULL, CHECK >= 0 | 월말 잔액 |

## 5. 인덱스 설계
- `scenarios(user_id)`
- `debts(scenario_id)`
- `simulation_results(scenario_id, strategy)`
- `monthly_plans(simulation_result_id, month_index)`

## 6. 데이터 보존 정책
- 시뮬레이션 결과는 시나리오 재계산 시 덮어쓰기 또는 버전 적재 중 택1
- MVP 기본값: 최신 결과 1개 유지(단순 운영)
