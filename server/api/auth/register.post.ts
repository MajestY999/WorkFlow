import { hash } from "bcryptjs";
import { createError, readBody, setResponseHeader } from "h3";
import { z } from "zod";
import { startSession } from "../../utils/auth";
import { withTransaction } from "../../utils/database";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(200),
});

export default defineEventHandler(async (event) => {
  const parsed = registerSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Проверьте имя, компанию, почту и пароль (не менее 8 символов).",
    });
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await hash(parsed.data.password, 12);
  let createdUser: {
    id: number;
    name: string;
    email: string;
    customerId: number;
  };
  try {
    createdUser = await withTransaction(async (client) => {
      const customer = await client.query<{ id: string }>(
        `INSERT INTO customers (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [parsed.data.company],
      );
      const customerRow = customer.rows[0];
      if (!customerRow) {
        throw createError({
          statusCode: 500,
          statusMessage: "Не удалось создать компанию.",
        });
      }

      const user = await client.query<{
        id: string;
        name: string;
        email: string;
      }>(
        `INSERT INTO users (name, email, password_hash, role, customer_id)
         VALUES ($1, $2, $3, 'Client', $4)
         RETURNING id, name, email`,
        [parsed.data.name, email, passwordHash, customerRow.id],
      );
      const row = user.rows[0];
      if (!row) {
        throw createError({
          statusCode: 500,
          statusMessage: "Не удалось создать учётную запись.",
        });
      }
      return {
        id: Number(row.id),
        name: row.name,
        email: row.email,
        customerId: Number(customerRow.id),
      };
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: "Учётная запись с такой почтой уже существует.",
      });
    }
    throw error;
  }

  await startSession(event, createdUser.id);
  setResponseHeader(event, "Cache-Control", "no-store");
  return {
    user: {
      ...createdUser,
      role: "Client" as const,
    },
  };
});
