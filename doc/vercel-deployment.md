# Vercel 배포 가이드

## 1. 목적
- DebtPilot 서비스를 Vercel에 안정적으로 배포하고 운영하기 위한 표준 절차를 정리한다.
- 대상 환경은 `Production`(실서비스)과 `Preview`(PR/브랜치 검증)로 구분한다.

## 2. 사전 준비
1. Git 저장소가 원격(GitHub/GitLab/Bitbucket)에 푸시되어 있어야 한다.
2. Vercel 계정 및 팀(선택)이 준비되어 있어야 한다.
3. 로컬에서 최소 검증을 통과해야 한다.

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## 3. 권장 배포 방식 (Git 연동)

### 3.1 프로젝트 연결
1. Vercel Dashboard 접속 후 `Add New... > Project`를 선택한다.
2. 저장소를 선택하고 Import 한다.
3. Framework Preset은 `Next.js`로 확인한다.

### 3.2 빌드 설정
- Install Command: `pnpm install --frozen-lockfile` (권장)
- Build Command: `pnpm build`
- Output Directory: 비워두기 (Next.js 기본 출력 사용)
- Node.js Version: 프로젝트와 동일한 LTS(권장: 20 이상)

#### 빠른 설정값 요약
| 항목 | 값 |
| --- | --- |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` |
| Output Directory | 비워두기 |

- 현재 프로젝트는 `package.json`의 `build` 스크립트가 `next build`이고, `next.config.mjs`에 `output` 강제 설정이 없다.
- 따라서 Vercel에서 Next.js 기본 동작을 사용하면 된다.

### 3.3 환경 변수 등록
1. `Settings > Environment Variables`에서 키를 등록한다.
2. 각 키를 `Production`, `Preview`, `Development` 중 필요한 환경에 매핑한다.
3. 민감 정보는 절대 Git에 커밋하지 않는다 (`.env*` 파일 제외 규칙 유지).

## 4. 배포 트리거 및 환경 전략
- `main` 브랜치 머지: Production 배포
- 기능 브랜치/PR: Preview 배포 URL 자동 생성
- 권장 브랜치 전략: PR에서 Preview 검증 후 `main` 머지

## 5. 첫 배포 이후 운영 설정

### 5.1 도메인 연결
1. `Settings > Domains`에서 도메인을 추가한다.
2. DNS 레코드(CNAME 또는 A)를 Vercel 안내값으로 설정한다.
3. SSL은 Vercel에서 자동 프로비저닝되는지 확인한다.

### 5.2 모니터링
- `Deployments` 탭에서 빌드/런타임 로그를 확인한다.
- 오류 발생 시 최근 배포의 Build Logs/Function Logs를 우선 확인한다.

### 5.3 롤백
- `Deployments`에서 정상 동작했던 이전 배포를 선택해 `Promote to Production`으로 즉시 복구한다.

## 6. CLI 배포 (선택)
대시보드 대신 CLI로 수동 배포가 필요할 때 사용한다.

```bash
pnpm dlx vercel
pnpm dlx vercel --prod
```

- 최초 1회 프로젝트 링크 절차가 진행된다.
- 팀 프로젝트라면 올바른 Scope(팀/개인)를 확인한다.

## 7. 배포 전/후 체크리스트

### 배포 전
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm build` 성공
- [ ] 필수 환경 변수 등록 완료
- [ ] `main` 기준 변경사항 리뷰 완료

### 배포 후
- [ ] Production URL 정상 접속
- [ ] 핵심 경로(메인 화면, 시뮬레이션, 결과 표시) 수동 점검
- [ ] 브라우저 콘솔/서버 로그에 치명 오류 없음

## 8. 자주 발생하는 이슈
- 빌드 실패: Node 버전 불일치 또는 누락된 환경 변수 가능성이 높다.
- 런타임 오류: Preview에는 있고 Production에는 없는 환경 변수 설정 차이를 점검한다.
- 도메인 미연결: DNS 전파 시간이 필요할 수 있으므로 TTL 이후 재확인한다.

## 9. 참고
- Vercel 공식 문서: https://vercel.com/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
