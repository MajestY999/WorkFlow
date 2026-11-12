import { createError, readBody } from "h3";
import { createRequestRecord } from "../../utils/mock-data";
import type { CreateRequestPayload } from "~/types/request";

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<CreateRequestPayload>>(event);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const client = typeof body.client === "string" ? body.client.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const priority = body.priority;

  if (!title || !client || !description) {
    throw createError({
      statusCode: 400,
      message: "Заполните название, клиента и описание заявки.",
    });
  }
  if (
    !priority ||
    !["Низкий", "Обычный", "Высокий", "Критический"].includes(priority)
  ) {
    throw createError({
      statusCode: 400,
      message: "Выберите корректный приоритет заявки.",
    });
  }

  return createRequestRecord({ title, client, description, priority });
});
