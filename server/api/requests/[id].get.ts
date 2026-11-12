import { createError, getRouterParam } from "h3";
import { applyDemoNetworkBehavior } from "../../utils/api-request";
import { getRequestRecord } from "../../utils/mock-data";

export default defineEventHandler(async (event) => {
  await applyDemoNetworkBehavior(event);
  const id = Number(getRouterParam(event, "id"));
  const request = Number.isInteger(id) ? getRequestRecord(id) : undefined;

  if (!request) {
    throw createError({ statusCode: 404, statusMessage: "Заявка не найдена." });
  }

  return request;
});
