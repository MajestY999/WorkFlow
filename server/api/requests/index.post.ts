import { createError, readBody } from "h3";
import { z } from "zod";
import { requireRoles } from "../../utils/auth";
import { withTransaction } from "../../utils/database";
import { getRequestForUser } from "../../utils/request-repository";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  client: z.string().trim().max(200).optional(),
  categoryId: z.number().int().positive(),
  description: z.string().trim().min(1).max(5000),
  priority: z.enum(["Низкий", "Обычный", "Высокий", "Критический"]),
});

export default defineEventHandler(async (event) => {
  const parsed = createSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Проверьте название, клиента, описание и приоритет заявки.",
    });
  }
  const user = event.context.user!;
  requireRoles(user, ["Client", "Operator", "Admin"]);

  const requestId = await withTransaction(async (client) => {
    let customerId: number;
    if (user.role === "Client") {
      if (user.customerId === null) {
        throw createError({
          statusCode: 403,
          statusMessage: "Для учётной записи не настроен клиент.",
        });
      }
      customerId = user.customerId;
    } else {
      const customer = await client.query<{ id: string }>(
        "SELECT id FROM customers WHERE name = $1",
        [parsed.data.client],
      );
      if (!customer.rows[0]) {
        throw createError({
          statusCode: 400,
          statusMessage: "Выберите существующего клиента.",
        });
      }
      customerId = Number(customer.rows[0].id);
    }

    const category = await client.query<{ id: string }>(
      "SELECT id FROM categories WHERE id = $1",
      [parsed.data.categoryId],
    );
    if (!category.rows[0]) {
      throw createError({
        statusCode: 500,
        statusMessage: "Категории заявок не настроены.",
      });
    }
    const now = new Date().toISOString();
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO requests (
         title, customer_id, requester_user_id, status, priority, category_id,
         created_at, due_at, description
       )
       VALUES ($1, $2, $3, 'Новая', $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        parsed.data.title,
        customerId,
        user.id,
        parsed.data.priority,
        Number(category.rows[0].id),
        now,
        now,
        parsed.data.description,
      ],
    );
    const request = inserted.rows[0];
    if (!request) {
      throw createError({
        statusCode: 500,
        statusMessage: "Не удалось создать заявку.",
      });
    }
    const id = Number(request.id);
    await client.query(
      `INSERT INTO request_timeline (request_id, actor_user_id, message, created_at)
       VALUES ($1, $2, $3, $4)`,
      [id, user.id, `${user.name} создал(а) заявку`, now],
    );
    return id;
  });

  return getRequestForUser(requestId, user);
});
