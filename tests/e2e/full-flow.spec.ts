import { expect, test } from "@playwright/test";

test("기본 사용자 플로우 진입 확인", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "DebtPilot" })).toBeVisible();
  await expect(page.getByRole("button", { name: "채무 추가" })).toBeVisible();
  await expect(page.getByRole("button", { name: "결과 계산" })).toBeVisible();
});

test("채무 입력/예산 설정 후 전략 결과 렌더링", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel(/월 상환 예산\(원\)/).fill("900000");
  await page.getByLabel(/추가 상환\(원, 선택\)/).fill("100000");
  await page.getByRole("button", { name: "결과 계산" }).click();

  await expect(page.getByRole("heading", { name: "Avalanche" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Snowball" })).toBeVisible();
  await expect(page.getByText("월별표", { exact: false })).toBeVisible();
});
