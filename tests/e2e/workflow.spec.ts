import { expect, test } from "@playwright/test";
import { loginAsOperator } from "./helpers/auth";

test("login, create, assign, change status, comment, refresh, and logout", async ({
  page,
}) => {
  await loginAsOperator(page);
  await expect(
    page.getByRole("button", { name: "Выйти", exact: true }),
  ).toHaveCount(0);
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
  await page.getByRole("button", { name: "Отменить изменение" }).click();
  await expect(
    page.getByRole("complementary").getByText("Назначена", { exact: true }),
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
  await page.getByRole("button", { name: "Изменить статус" }).click();
  await page.getByLabel("Новый статус").selectOption("Назначена");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(
    page.getByRole("complementary").getByText("Назначена", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Отменить изменение" }).click();
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
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(comment, { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("complementary")
      .getByText("Ожидает ответа", { exact: true }),
  ).toBeVisible();
  await page.goto("/profile");
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("button", { name: "Выйти из аккаунта", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Завершить работу?")).toHaveCount(0);
  await expect(page.getByText("Вы вернётесь на главную страницу.")).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Выйти из аккаунта", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await page.goto("/requests");
  await expect(page).toHaveURL(/\/login\?redirect=.*requests/);
});
