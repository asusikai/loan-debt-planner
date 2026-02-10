# Git Commit Convention

DebtPilot 저장소 커밋 메시지 일관성 유지를 위한 규칙

## 1. 기본 형식

```text
<type>(<scope>): <subject>

<body>

<footer>
```

- `type`: 변경 성격(필수)
- `scope`: 영향 범위(선택)
- `subject`: 한 줄 요약(필수)
- `body`: 변경 이유/의도(선택)
- `footer`: 이슈 참조, BREAKING CHANGE 등(선택)

## 2. type 규칙

- `feat`: 사용자 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 추가/수정
- `refactor`: 동작 변경 없는 구조 개선
- `test`: 테스트 추가/수정
- `chore`: 빌드/설정/유틸/의존성 관리
- `style`: 포맷팅, 세미콜론 등 비기능 변경
- `perf`: 성능 개선
- `build`: 빌드 시스템/패키징 변경
- `ci`: CI/CD 설정 변경
- `revert`: 이전 커밋 되돌림

## 3. subject 작성 규칙

- 50자 내외로 짧고 명확하게 작성
- 마침표(`.`) 없이 작성
- 문장형 종결 대신 명사형 종결
- 무엇을 바꿨는지보다 왜 필요한지 중심 표현
- 한 커밋당 한 가지 목적 유지

## 4. scope 가이드

권장 방식: 도메인/경로 단위 작성

- `repayment`, `validation`, `ui`, `docs`, `api`, `db`, `infra`

예시:

- `feat(repayment): avalanche 전략 월별 배분 로직 추가`
- `fix(validation): 월 예산 최소납입액 미만 입력 차단`
- `docs(api): 시뮬레이션 응답 예시와 오류 코드 보강`

## 5. body/footer 가이드

- 본문(`body`): 배경/의도 중심 1~3줄
- 푸터(`footer`): 이슈 추적 정보 포함
- 본문 문체: 명사형 종결

예시:

```text
fix(repayment): 중도상환수수료 반영 시 총이자 계산 오류 수정

일부 케이스에서 수수료를 이자 절감액에 중복 차감하던 문제 해소
전략 비교 결과 총비용 일관성 확보

Refs: #12
```

## 6. DebtPilot 권장 커밋 예시

- `docs: DebtPilot 초기 기획/설계 문서 추가`
- `feat(ui): 전략 비교 결과 카드와 추천 문구 추가`
- `feat(repayment): snowball 전략 우선순위 계산 구현`
- `test(repayment): 0% 금리 및 예산 부족 케이스 추가`
- `chore: Next.js + TypeScript 프로젝트 초기 스캐폴딩`

## 7. 금지/주의 사항

- 의미 없는 메시지 금지: `update`, `fix bug`, `wip`
- 여러 성격의 단일 커밋 혼합 금지
- 대규모 변경 시 기능 단위 커밋 분리
- 자동 생성 파일 커밋 시 제목/본문 의도 명시
