import { expect, test } from "@playwright/test";

test("기본 사용자 플로우 진입 확인", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "DebtPilot" })).toBeVisible();
  await expect(page.getByRole("button", { name: "채무 추가" })).toBeVisible();
  await expect(page.getByRole("button", { name: "결과 계산" })).toBeVisible();
});
