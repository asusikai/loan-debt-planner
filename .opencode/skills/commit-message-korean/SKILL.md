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
5. If user asks, provide body/footer with noun-style lines

## Decision rules

- Prefer one dominant purpose for one commit message
- Use `docs` only for pure documentation changes
- Use `chore` for setup/config/scaffolding intent
- If mixed staged changes have one clear primary intent, choose that intent
- If mixed changes have no clear single intent, recommend split commits first

## Output format

- First line: best single recommendation
- Then 2-4 alternatives
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
