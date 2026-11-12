import type { H3Event } from "h3";
import { createError, getQuery } from "h3";

function getQueryValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export async function applyDemoNetworkBehavior(event: H3Event) {
  const query = getQuery(event);
  const demo = getQueryValue(query.demo);
  const retry = Number(getQueryValue(query.retry) ?? 0);
  const delay = Number(getQueryValue(query.delay) ?? 0);

  if (delay > 0) {
    await new Promise((resolve) =>
      globalThis.setTimeout(resolve, Math.min(delay, 5000)),
    );
  }
  if (retry > 0) return;
  if (demo === "429") {
    throw createError({
      statusCode: 429,
      message: "Слишком много запросов. Подождите немного и повторите.",
    });
  }
  if (demo === "500") {
    throw createError({
      statusCode: 500,
      message:
        "Сервис временно недоступен. Попробуйте загрузить данные ещё раз.",
    });
  }
}

export function getStringQuery(value: unknown) {
  return getQueryValue(value);
}
