import { createError, getQuery, setResponseHeader } from "h3";
import { z } from "zod";
import type { RequestPriority, RequestStatus } from "#shared/types/request";
import { listRequestsForUser } from "../../utils/request-repository";

const requestQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["Новая", "Назначена", "Ожидает ответа", "Решена"]).optional(),
  priority: z.enum(["Низкий", "Обычный", "Высокий", "Критический"]).optional(),
  assignee: z.string().trim().max(120).optional(),
  sort: z
    .enum(["newest", "oldest", "priority-high", "priority-low"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});

export default defineEventHandler(async (event) => {
  const parsed = requestQuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректные параметры списка заявок.",
    });
  }
  const filters = {
    ...parsed.data,
    status: parsed.data.status as RequestStatus | undefined,
    priority: parsed.data.priority as RequestPriority | undefined,
  };
  const result = await listRequestsForUser(event.context.user!, filters);
  setResponseHeader(event, "Cache-Control", "no-store");
  return result;
});
