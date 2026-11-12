import { createError, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { withTransaction } from "../../../utils/database";
import { getRequestForUser } from "../../../utils/request-repository";

const commentSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректный номер заявки.",
    });
  }
  const parsed = commentSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Комментарий должен содержать от 1 до 2000 символов.",
    });
  }
  const user = event.context.user!;

  await withTransaction(async (client) => {
    const request = await client.query<{ version: number }>(
      `SELECT version FROM requests
       WHERE id = $1
         AND ($2 <> 'Client' OR requester_user_id = $3)
         AND ($2 <> 'Agent' OR assignee_id = $3)
       FOR UPDATE`,
      [id, user.role, user.id],
    );
    if (!request.rows[0]) {
      throw createError({
        statusCode: 404,
        statusMessage: "Заявка не найдена.",
      });
    }
    const now = new Date().toISOString();
    await client.query(
      `INSERT INTO request_comments (request_id, author_user_id, author_name, body, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, user.id, user.name, parsed.data.text, now],
    );
    await client.query(
      `INSERT INTO request_timeline (request_id, actor_user_id, message, created_at)
       VALUES ($1, $2, $3, $4)`,
      [id, user.id, `${user.name} добавил(а) комментарий`, now],
    );
    await client.query(
      "UPDATE requests SET version = version + 1, updated_at = now() WHERE id = $1",
      [id],
    );
  });

  return getRequestForUser(id, user);
});
