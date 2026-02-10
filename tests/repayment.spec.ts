import { expect, test } from "@playwright/test";

test("home renders title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "DebtPilot" })).toBeVisible();
});
