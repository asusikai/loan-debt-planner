---
name: commit-message-korean
description: Recommend Korean commit messages from current staged changes using repo convention
compatibility: opencode
metadata:
  language: ko-KR
  domain: git
---

## What I do

- Analyze only current staged changes (`git diff --cached`, `git diff --cached --name-status`)
- Read commit rules from `doc/git-commit-convention.md`
- Recommend Korean commit messages that follow the convention

## When to use me

- User asks for a commit message based on staged changes
- User wants message style aligned with repository convention

## Required workflow

1. Run git checks in parallel
   - `git status --short`
   - `git diff --cached --name-status`
   - `git diff --cached`
2. Read `doc/git-commit-convention.md`
3. Infer the best `type` and optional `scope`
4. Draft subject in Korean with noun-style ending
   - Keep around 50 chars
   - No trailing period
   - Avoid vague subjects such as `update`, `fix bug`, `wip`
   - Include concrete change target and outcome
   - Prefer structure: `<대상> + <변경 성격> + <의도/효과>`
5. If user asks, provide body/footer with noun-style lines

## Decision rules

- Prefer one dominant purpose for one commit message
- Use `docs` only for pure documentation changes
- Use `chore` for setup/config/scaffolding intent
- If mixed staged changes have one clear primary intent, choose that intent
- If mixed changes have no clear single intent, recommend split commits first
- Reflect staged file evidence directly in subject
  - Example target tokens: `채무 입력 폼`, `전략 비교 화면`, `상환 엔진`, `검증 스키마`, `테스트 환경`
- Exclude build artifacts from core intent when possible
  - Example: `tsconfig.tsbuildinfo` alone should not dominate type/scope

## Specificity rules

- Do not use abstract subjects
  - Bad: `기능 개선`, `구조 수정`, `업데이트`
  - Good: `채무 입력/수정 UI와 전략 결과 카드 연동 구현`
- Mention at least one domain noun from staged diff
  - UI: `폼`, `결과 카드`, `월별표`, `탭`, `오류 안내`
  - Domain: `상환 엔진`, `Avalanche`, `Snowball`, `입력 검증`
  - Infra: `스캐폴딩`, `테스트 설정`, `API 라우트`
- If staged changes span multiple concerns, choose primary concern in recommendation 1 and vary alternatives by concern

## Output format

- First line: best single recommendation
- Then 2-4 alternatives
- For each recommendation, add 1-line rationale tied to staged files
- If requested, include full message block:

```text
<type>(<scope>): <subject>

<body line 1>
<body line 2>

Refs: #<issue>
```

## Response style

- Korean only
- Concise and practical
- Explain the reason in 1-2 short bullets
- Avoid generic wording; maximize specificity from staged evidence
