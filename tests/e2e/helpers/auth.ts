import { expect, type Page } from "@playwright/test";

const operatorEmail =
  process.env.WORKFLOW_E2E_EMAIL ?? "operator@workflow.local";
const operatorPassword = process.env.WORKFLOW_E2E_PASSWORD ?? "Operator123!";

export async function loginAsOperator(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Электронная почта").fill(operatorEmail);
  await page.getByLabel("Пароль").fill(operatorPassword);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.waitForLoadState("networkidle");
}
