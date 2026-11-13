import { expect, test } from "@playwright/test";
import { loginAsOperator } from "./helpers/auth";

test("HTTP 401 while commenting returns the user to login", async ({
  page,
}) => {
  await loginAsOperator(page);
  await page.goto("/requests/1042");
  await page.waitForLoadState("networkidle");
  await page.route("**/api/requests/**/comments", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        statusCode: 401,
        statusMessage: "Требуется вход в систему.",
      }),
    }),
  );
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ user: null, expired: true }),
    }),
  );
  await page
    .getByLabel("Ваш комментарий")
    .fill("Комментарий при истёкшей сессии.");
  await page.getByRole("button", { name: "Отправить комментарий" }).click();
  await expect(page).toHaveURL(/\/login\?.*session-expired/);
});

test("HTTP 409 rolls an optimistic priority change back", async ({ page }) => {
  await loginAsOperator(page);
  await page.goto("/requests/1042");
  await page.waitForLoadState("networkidle");
  const priority = page.getByLabel("Приоритет");
  const originalValue = await priority.inputValue();
  await page.route("**/api/requests/**", (route) =>
    route.request().method() === "PATCH"
      ? route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            statusCode: 409,
            statusMessage: "Заявка уже изменена другим пользователем.",
          }),
        })
      : route.continue(),
  );
  const updateResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/requests/1042" &&
      response.request().method() === "PATCH",
  );
  await priority.selectOption(
    originalValue === "Критический" ? "Низкий" : "Критический",
  );
  expect((await updateResponse).status()).toBe(409);
  await expect(
    page.getByText(/предыдущее значение восстановлено/i),
  ).toBeVisible();
  await expect(priority).toHaveValue(originalValue);
});
