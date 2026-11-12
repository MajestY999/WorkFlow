import { createError, getQuery, getRouterParam, readBody } from "h3";
import { addRequestComment } from "../../../utils/mock-data";
import type { CreateCommentPayload } from "~/types/request";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  const query = getQuery(event);
  const body = await readBody<Partial<CreateCommentPayload>>(event);
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const author =
    typeof body.author === "string" && body.author.trim()
      ? body.author.trim()
      : "Анна Кузнецова";

  if (!Number.isInteger(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректный номер заявки.",
    });
  }
  if (query.demoComment === "500") {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Не удалось отправить комментарий. Текст сохранён в поле ввода.",
    });
  }
  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: "Введите текст комментария.",
    });
  }
  if (text.length > 2000) {
    throw createError({
      statusCode: 400,
      statusMessage: "Комментарий не должен превышать 2000 символов.",
    });
  }

  const request = addRequestComment(id, author, text);
  if (!request) {
    throw createError({ statusCode: 404, statusMessage: "Заявка не найдена." });
  }
  return request;
});
