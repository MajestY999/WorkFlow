import { expect, test } from "@playwright/test";

const operatorEmail =
  process.env.WORKFLOW_E2E_EMAIL ?? "operator@workflow.local";
const operatorPassword = process.env.WORKFLOW_E2E_PASSWORD ?? "Operator123!";

async function loginAsOperator(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Электронная почта").fill(operatorEmail);
  await page.getByLabel("Пароль").fill(operatorPassword);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.waitForLoadState("networkidle");
}

test("login, create, assign, change status, comment, refresh, and logout", async ({
  page,
}) => {
  await loginAsOperator(page);
  await page.goto("/requests");
  await page.waitForLoadState("networkidle");

  const title = `E2E заявка ${Date.now()}`;
  let createAttempts = 0;
  await page.route("**/api/requests*", async (route) => {
    if (route.request().method() === "POST" && createAttempts++ === 0) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 500,
          statusMessage: "Временная ошибка тестового сервера.",
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.getByRole("button", { name: "Создать заявку" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Создать заявку" })
    .click();
  await expect(page.getByText("Укажите название заявки.")).toBeVisible();
  await expect(page.getByText("Укажите клиента.")).toBeVisible();
  await expect(page.getByText("Опишите проблему.")).toBeVisible();
  await page.getByPlaceholder("Кратко опишите проблему").fill(title);
  await page.getByPlaceholder("Название компании").fill("АО «Вектор»");
  await page
    .getByPlaceholder("Подробности обращения")
    .fill("Проверка полного пользовательского сценария.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Создать заявку" })
    .click();
  await expect(
    page.getByText("Данные не потеряны. Повторите попытку."),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Кратко опишите проблему")).toHaveValue(
    title,
  );
  await page.getByRole("button", { name: "Повторить" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Назначить исполнителя" }).click();
  await page.getByLabel("Исполнитель").selectOption({ label: "Брунгильда Б." });
  await page.getByRole("button", { name: "Назначить", exact: true }).click();
  await expect(
    page.getByRole("complementary").getByText("Брунгильда Б.", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Изменить статус" }).click();
  await page.getByLabel("Новый статус").selectOption("Ожидает ответа");
  await page.getByLabel("Причина ожидания").fill("Ожидаем данные от клиента.");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(
    page
      .getByRole("complementary")
      .getByText("Ожидает ответа", { exact: true }),
  ).toBeVisible();

  const comment = `Проверка комментария ${Date.now()}`;
  let commentPosts = 0;
  await page.route("**/api/requests/**/comments", async (route) => {
    if (route.request().method() === "POST") commentPosts += 1;
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.continue();
  });
  await page.getByLabel("Ваш комментарий").fill(comment);
  await page.locator(".comment-form").evaluate((form: HTMLFormElement) => {
    const submitTwice = () => {
      form.dispatchEvent(
        new SubmitEvent("submit", { bubbles: true, cancelable: true }),
      );
      form.dispatchEvent(
        new SubmitEvent("submit", { bubbles: true, cancelable: true }),
      );
    };
    submitTwice();
  });
  await expect(page.getByText(comment, { exact: true })).toBeVisible();
  await expect.poll(() => commentPosts).toBe(1);

  await page.reload();
  await expect(page.getByText(comment, { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("complementary")
      .getByText("Ожидает ответа", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/requests");
  await expect(page).toHaveURL(/\/login\?redirect=.*requests/);
});

test("latest search response wins when an earlier request is delayed", async ({
  page,
}) => {
  await loginAsOperator(page);
  await page.goto("/requests");
  await page.waitForLoadState("networkidle");

  let releaseOldResponse!: () => void;
  let oldRequestStarted!: () => void;
  const oldResponseGate = new Promise<void>((resolve) => {
    releaseOldResponse = resolve;
  });
  const oldRequestGate = new Promise<void>((resolve) => {
    oldRequestStarted = resolve;
  });
  let latestRequestStarted!: () => void;
  const latestRequestGate = new Promise<void>((resolve) => {
    latestRequestStarted = resolve;
  });

  await page.route("**/api/requests*", async (route) => {
    const url = new URL(route.request().url());
    const search = url.searchParams.get("q");
    if (route.request().method() !== "GET") return route.continue();
    if (search === "устаревший") {
      oldRequestStarted();
      await oldResponseGate;
      try {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: 90001,
                title: "Устаревший ответ",
                status: "Новая",
                priority: "Обычный",
              },
            ],
            total: 1,
            page: 1,
            pageSize: 12,
            totalPages: 1,
            statusCounts: {
              Новая: 1,
              Назначена: 0,
              "Ожидает ответа": 0,
              Решена: 0,
            },
          }),
        });
      } catch {
        // Nuxt может отменить устаревший запрос до получения ответа.
      }
      return;
    }
    if (search === "актуальный") {
      latestRequestStarted();
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: 90002,
              title: "Актуальный результат",
              status: "Новая",
              priority: "Обычный",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 12,
          totalPages: 1,
          statusCounts: {
            Новая: 1,
            Назначена: 0,
            "Ожидает ответа": 0,
            Решена: 0,
          },
        }),
      });
      return;
    }
    await route.continue();
  });

  const search = page.getByRole("searchbox", { name: "Поиск" });
  await search.fill("устаревший");
  await oldRequestGate;
  await search.fill("актуальный");
  await latestRequestGate;
  await expect(
    page.getByRole("link", { name: "Актуальный результат", exact: true }),
  ).toBeVisible();
  releaseOldResponse();
  await expect(page.getByText("Устаревший ответ", { exact: true })).toHaveCount(
    0,
  );
});

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
