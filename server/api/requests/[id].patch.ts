import { createError, getRouterParam, readBody } from "h3";
import { z } from "zod";
import type { RequestPriority, RequestStatus } from "#shared/types/request";
import { canTransitionRequestStatus } from "#shared/utils/request-rules";
import { withTransaction } from "../../utils/database";
import { getRequestForUser } from "../../utils/request-repository";

const updateSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    status: z
      .enum(["Новая", "Назначена", "Ожидает ответа", "Решена"])
      .optional(),
    priority: z
      .enum(["Низкий", "Обычный", "Высокий", "Критический"])
      .optional(),
    assignee: z.string().trim().min(1).max(120).nullable().optional(),
    assigneeId: z.number().int().positive().nullable().optional(),
    comment: z.string().trim().max(2000).optional(),
    reason: z.string().trim().max(2000).optional(),
  })
  .refine(
    (body) =>
      body.status !== undefined ||
      body.priority !== undefined ||
      body.assigneeId !== undefined,
  );

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректный номер заявки.",
    });
  }
  const body = await readBody(event);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Проверьте переданные изменения.",
    });
  }
  const user = event.context.user!;
  if (user.role === "Client") {
    throw createError({
      statusCode: 403,
      statusMessage: "Клиент не может изменять поля заявки.",
    });
  }
  if (
    user.role === "Agent" &&
    (parsed.data.priority !== undefined || parsed.data.assigneeId !== undefined)
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: "Исполнитель может изменять только статус своей заявки.",
    });
  }

  await withTransaction(async (client) => {
    const result = await client.query<{
      version: number;
      status: RequestStatus;
      priority: RequestPriority;
      assignee_id: string | null;
    }>(
      `SELECT version, status, priority, assignee_id
       FROM requests
       WHERE id = $1
         AND ($2 <> 'Agent' OR assignee_id = $3)
       FOR UPDATE`,
      [id, user.role, user.id],
    );
    const current = result.rows[0];
    if (!current) {
      throw createError({
        statusCode: 404,
        statusMessage: "Заявка не найдена.",
      });
    }
    if (current.version !== parsed.data.expectedVersion) {
      throw createError({
        statusCode: 409,
        statusMessage:
          "Заявка была изменена другим пользователем. Обновите данные.",
      });
    }

    let assigneeId = current.assignee_id;
    let assigneeName = "Не назначен";
    if (parsed.data.assigneeId !== undefined) {
      if (parsed.data.assigneeId === null) {
        assigneeId = null;
      } else {
        const assigneeResult = await client.query<{ id: string; name: string }>(
          `SELECT id, name FROM users
           WHERE id = $1 AND role = 'Agent' AND is_active = TRUE`,
          [parsed.data.assigneeId],
        );
        const assignee = assigneeResult.rows[0];
        if (
          !assignee ||
          (parsed.data.assignee && assignee.name !== parsed.data.assignee)
        ) {
          throw createError({
            statusCode: 400,
            statusMessage: "Исполнитель не найден или деактивирован.",
          });
        }
        assigneeId = assignee.id;
        assigneeName = assignee.name;
      }
    }

    let status = parsed.data.status ?? current.status;
    if (
      parsed.data.assigneeId !== undefined &&
      parsed.data.status === undefined
    ) {
      status = assigneeId === null ? "Новая" : "Назначена";
    }
    if (!canTransitionRequestStatus(current.status, status)) {
      throw createError({
        statusCode: 409,
        statusMessage: `Недопустимый переход статуса: «${current.status}» → «${status}».`,
      });
    }
    if (status === "Назначена" && assigneeId === null) {
      throw createError({
        statusCode: 409,
        statusMessage:
          "Перед переводом в статус «Назначена» выберите исполнителя.",
      });
    }
    if (
      status !== current.status &&
      (status === "Ожидает ответа" || status === "Решена") &&
      !parsed.data.reason
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          status === "Решена"
            ? "Укажите результат решения или причину закрытия."
            : "Укажите причину ожидания.",
      });
    }

    const priority = parsed.data.priority ?? current.priority;
    const updateResult = await client.query(
      `UPDATE requests
       SET status = $2, priority = $3, assignee_id = $4, version = version + 1, updated_at = now()
       WHERE id = $1 AND version = $5`,
      [id, status, priority, assigneeId, parsed.data.expectedVersion],
    );
    if (updateResult.rowCount !== 1) {
      throw createError({
        statusCode: 409,
        statusMessage:
          "Заявка была изменена другим пользователем. Обновите данные.",
      });
    }

    if (status !== current.status) {
      await client.query(
        `INSERT INTO request_timeline (request_id, actor_user_id, message, created_at)
         VALUES ($1, $2, $3, $4)`,
        [id, user.id, `Статус изменён: ${status}`, new Date().toISOString()],
      );
    }
    if (priority !== current.priority) {
      await client.query(
        `INSERT INTO request_timeline (request_id, actor_user_id, message, created_at)
         VALUES ($1, $2, $3, $4)`,
        [
          id,
          user.id,
          `Приоритет изменён: ${priority}`,
          new Date().toISOString(),
        ],
      );
    }
    if (assigneeId !== current.assignee_id) {
      await client.query(
        `INSERT INTO request_timeline (request_id, actor_user_id, message, created_at)
         VALUES ($1, $2, $3, $4)`,
        [
          id,
          user.id,
          `Исполнитель изменён: ${assigneeName}`,
          new Date().toISOString(),
        ],
      );
    }
    const auditComment = parsed.data.reason || parsed.data.comment;
    if (auditComment) {
      await client.query(
        `INSERT INTO request_comments (request_id, author_user_id, author_name, body, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, user.id, user.name, auditComment, new Date().toISOString()],
      );
      await client.query(
        `INSERT INTO request_timeline (request_id, actor_user_id, message, created_at)
         VALUES ($1, $2, $3, $4)`,
        [
          id,
          user.id,
          parsed.data.reason
            ? "Добавлена причина изменения статуса"
            : "Добавлен комментарий при назначении исполнителя",
          new Date().toISOString(),
        ],
      );
    }
  });

  return getRequestForUser(id, user);
});
