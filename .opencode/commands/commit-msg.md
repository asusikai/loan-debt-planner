---
description: 현재 staged changes 기반 한국어 커밋 메시지 추천
---

`commit-message-korean` 스킬을 사용해 현재 staged changes에 맞는 한국어 커밋 메시지를 추천.

필수 절차:

1. `git status --short`, `git diff --cached --name-status`, `git diff --cached` 실행
2. `doc/git-commit-convention.md` 규칙 확인
3. 규칙에 맞는 커밋 메시지 추천

출력 규칙:

- 최우선 추천 1개
- 대안 2~4개
- 각 추천의 간단한 근거
- 요청 시 full message block 제공

예외 처리:

- staged changes가 없으면 "staged changes 없음" 안내 후 종료
