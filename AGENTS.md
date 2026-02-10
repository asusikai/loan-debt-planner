# AGENTS.md

## Purpose
- This file guides agentic coding agents working in this repository.
- Scope: build a loan/debt repayment strategy web app based on `doc/loan-debt-planner-idea.md`.
- Priority: correctness of financial calculations, clear problem definition, and runnable prototype.

## Repository Status (observed)
- Current repo is documentation-only.
- Existing files:
  - `doc/loan-debt-planner-idea.md`
  - `doc/problem-definition.md`
- No detected project scaffold yet (no package manager manifest, no test config, no linter config).
- No Cursor rules found at `.cursor/rules/` or `.cursorrules`.
- No Copilot rules found at `.github/copilot-instructions.md`.

## Product Domain and Boundaries
- Domain: personal finance -> loan and debt management.
- Target users: early-career users with multiple debts and limited monthly cash flow.
- Core value: compare repayment strategies (Avalanche vs Snowball) with transparent numbers.
- Non-goal: no external financial API dependency.
- Non-goal: no legal/tax/financial advice claims.

## Recommended Stack for Initiation
- App type: Web app (PWA optional later), desktop-first with mobile support.
- Framework: Next.js (App Router) + TypeScript.
- UI: React + minimal component library or plain CSS modules.
- Validation: Zod (or equivalent schema validator).
- Unit tests: Vitest.
- E2E tests: Playwright (optional for bonus).
- Package manager: pnpm (preferred for speed and lockfile determinism).

## Build / Lint / Test Commands
- Note: commands below are the standard target after scaffolding.
- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Production build: `pnpm build`
- Start production server: `pnpm start`
- Lint: `pnpm lint`
- Type check: `pnpm typecheck`
- Unit tests (all): `pnpm test`
- Unit tests (watch): `pnpm test:watch`
- Unit tests (single file): `pnpm vitest run src/lib/repayment/engine.test.ts`
- Unit tests (single test name): `pnpm vitest run -t "avalanche should reduce total interest"`
- Coverage: `pnpm test:coverage`
- E2E tests: `pnpm test:e2e`
- E2E single spec: `pnpm playwright test tests/repayment.spec.ts`

## If Commands Are Missing
- If `package.json` scripts differ, use repo scripts as source of truth.
- If Vitest is not installed, do not invent commands; add TODO in PR notes.
- Prefer adding missing scripts explicitly rather than running tool defaults ad hoc.

## Expected Script Names (when bootstrapping)
- `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:coverage`, `test:e2e`.
- Keep script names stable to simplify agent automation.

## Code Style Guidelines

### Imports
- Group imports: external -> internal aliases -> relative.
- Keep side-effect imports explicit and rare.
- Avoid deep relative traversal when an alias can be used.
- Do not leave unused imports.

### Formatting
- Use Prettier defaults unless repo config says otherwise.
- Keep lines readable; avoid dense one-liners for business logic.
- Use trailing commas where formatter applies them.
- Keep one component/function responsibility per block.

### Type Safety
- TypeScript strict mode preferred.
- Never use `any` for core repayment logic.
- Avoid `as unknown as` casts; model proper types instead.
- Represent money explicitly (see Money section below).

### Naming Conventions
- Files: kebab-case for modules, PascalCase for React components.
- Variables/functions: camelCase.
- Types/interfaces: PascalCase.
- Constants: UPPER_SNAKE_CASE only for true constants.
- Test names should describe behavior, not implementation detail.

### Functions and Modules
- Prefer pure functions for calculation engine.
- Keep UI and math logic separated.
- Keep functions small and composable.
- Pass explicit input objects for complex function signatures.

### Error Handling
- Do not swallow errors.
- Validate user input before calculation.
- Return typed error states for recoverable issues.
- Throw only for truly exceptional internal faults.
- Show user-safe error messages; avoid leaking internals.

### Financial Calculation Rules
- Do not use floating-point comparisons without tolerance.
- Prefer integer minor units (e.g., KRW as whole won) where possible.
- Define rounding policy once and reuse it consistently.
- Document assumptions for interest accrual and payment timing.
- Keep strategy outputs deterministic for same inputs.

### Validation Rules
- Reject negative balances, rates, or payments.
- Enforce minimum required fields before simulation.
- Guard against `monthlyBudget < sum(minimumPayments)`.
- Guard against impossible payoff scenarios and report clearly.

### UI/UX Rules
- Optimize for quick data entry and strategy comparison.
- Keep primary outcomes above the fold: total interest, payoff date, monthly plan.
- Clearly label strategy A/B and the recommendation rationale.
- Preserve readability on both mobile and desktop widths.

### Testing Guidelines
- Unit-test the repayment engine before UI details.
- Include fixture cases for:
  - single debt
  - multiple debts with different rates
  - zero-interest debt
  - early repayment fee impact
  - insufficient monthly budget
- Add regression tests for previously found calculation bugs.
- Keep snapshot tests limited to stable presentational output.

## Suggested Project Structure (after initiation)
- `src/app/` routes and pages
- `src/components/` UI components
- `src/features/repayment/` feature UI + orchestration
- `src/lib/repayment/` pure calculation engine
- `src/lib/validation/` schemas and parse helpers
- `src/types/` shared domain types
- `tests/` e2e and integration specs

## Agent Workflow
- Read `doc/loan-debt-planner-idea.md` before implementing features.
- Keep changes small and reviewable.
- Prefer adding tests with logic changes.
- Run lint + typecheck + targeted tests before finalizing.
- Document assumptions in PR/commit notes.

## Definition of Done
- Feature matches documented problem scope.
- Calculation outputs are test-backed and reproducible.
- No new lint/type errors.
- README includes local run steps.
- Edge cases listed in docs are handled in code or explicitly deferred.

## Notes for Future Rule Files
- If `.cursor/rules/` or `.cursorrules` appears, treat it as higher-priority local policy.
- If `.github/copilot-instructions.md` appears, merge its guidance into this file on next update.
