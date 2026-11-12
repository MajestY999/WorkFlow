import { createError, getRouterParam } from "h3";
import { getRequestForUser } from "../../utils/request-repository";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректный номер заявки.",
    });
  }
  return getRequestForUser(id, event.context.user!);
});
