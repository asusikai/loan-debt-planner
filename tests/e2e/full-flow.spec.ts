import { expect, test } from "@playwright/test";

test("기본 사용자 플로우 진입 확인", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "DebtPilot" })).toBeVisible();
  await expect(page.getByText("채무가 없습니다. 첫 채무를 추가해 시작하세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "결과 계산" })).toBeVisible();
});

test("채무 입력/추가상환 설정 후 전략 결과 렌더링", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "채무 추가" }).click();
  await page.getByLabel(/채무명 \*/).fill("신용대출A");
  await page.getByLabel(/잔액\(원\) \*/).fill("5000000");
  await page.getByLabel(/연이율\(%\) \*/).fill("8.2");
  await page.locator("form").getByRole("button", { name: "채무 추가" }).click();

  await page.getByLabel(/추가 상환\(원, 선택\)/).fill("100000");
  await page.getByRole("button", { name: "결과 계산" }).click();

  await expect(page.getByRole("heading", { name: "Avalanche" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Snowball" })).toBeVisible();
  await expect(page.getByText("월별표", { exact: false })).toBeVisible();
});

test("상태 초기화 버튼으로 입력 상태 복구", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "채무 추가" }).click();
  await page.getByLabel(/채무명 \*/).fill("신용대출A");
  await page.getByLabel(/잔액\(원\) \*/).fill("5000000");
  await page.getByLabel(/연이율\(%\) \*/).fill("8.2");
  await page.locator("form").getByRole("button", { name: "채무 추가" }).click();

  await page.getByLabel(/추가 상환\(원, 선택\)/).fill("123456");
  await page.getByRole("button", { name: "상태 초기화" }).click();
  await page.getByRole("button", { name: "예" }).click();

  await expect(page.getByLabel(/추가 상환\(원, 선택\)/)).toHaveValue("");
  await expect(page.getByText("채무가 없습니다. 첫 채무를 추가해 시작하세요.")).toBeVisible();
});

test("비정상 localStorage 값 주입 시에도 앱이 렌더링됨", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("debtpilot_debts", "{broken-json");
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "DebtPilot" })).toBeVisible();
});
