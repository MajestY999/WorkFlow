import { createError, getQuery, getRouterParam, readBody } from "h3";
import {
  updateRequestRecord,
  isRequestPriority,
  isRequestStatus,
  users,
} from "../../utils/mock-data";
import type { UpdateRequestPayload } from "~/types/request";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody<Partial<UpdateRequestPayload>>(event);
  const expectedVersion = body.expectedVersion;
  const query = getQuery(event);
  const demoError =
    typeof query.demoUpdate === "string" ? query.demoUpdate : "";

  if (demoError === "409") {
    throw createError({
      statusCode: 409,
      statusMessage:
        "Заявка была изменена другим оператором. Данные восстановлены.",
    });
  }
  if (demoError === "500") {
    throw createError({
      statusCode: 500,
      statusMessage: "Не удалось сохранить изменение. Попробуйте ещё раз.",
    });
  }
  if (!Number.isInteger(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректный номер заявки.",
    });
  }
  if (
    typeof expectedVersion !== "number" ||
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Не указана версия заявки.",
    });
  }

  const updates: Pick<
    UpdateRequestPayload,
    "status" | "priority" | "assignee"
  > = {};
  if (body.status !== undefined) {
    if (!isRequestStatus(body.status)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Указан некорректный статус.",
      });
    }
    updates.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!isRequestPriority(body.priority)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Указан некорректный приоритет.",
      });
    }
    updates.priority = body.priority;
  }
  if (body.assignee !== undefined) {
    if (
      body.assignee !== null &&
      (typeof body.assignee !== "string" ||
        !users.some((user) => user.name === body.assignee))
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Указан некорректный исполнитель.",
      });
    }
    updates.assignee = body.assignee;
  }
  if (Object.keys(updates).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Нет изменений для сохранения.",
    });
  }

  const updated = updateRequestRecord(id, expectedVersion, updates);
  if (updated === undefined) {
    throw createError({ statusCode: 404, statusMessage: "Заявка не найдена." });
  }
  if (updated === null) {
    throw createError({
      statusCode: 409,
      statusMessage: "Заявка была изменена другим оператором. Обновите данные.",
    });
  }
  return updated;
});
