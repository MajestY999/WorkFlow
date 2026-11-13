import { expect, test } from "@playwright/test";
import { loginAsOperator } from "./helpers/auth";

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

test("search field follows q changes from browser history", async ({
  page,
}) => {
  await loginAsOperator(page);
  await page.goto("/requests");
  await page.waitForLoadState("networkidle");

  const search = page.getByRole("searchbox", { name: "Поиск" });
  await search.fill("первый запрос");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("первый запрос");

  await page.evaluate(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("q", "из истории");
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await expect(search).toHaveValue("из истории");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("из истории");
});
