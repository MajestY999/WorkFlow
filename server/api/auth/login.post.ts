import { compare } from "bcryptjs";
import { createError, readBody, setResponseHeader } from "h3";
import { z } from "zod";
import type { UserRole } from "#shared/types/request";
import { startSession } from "../../utils/auth";
import { query } from "../../utils/database";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export default defineEventHandler(async (event) => {
  const parsed = loginSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Введите корректную почту и пароль.",
    });
  }

  const result = await query<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: UserRole;
    customer_id: string | null;
    is_active: boolean;
  }>(
    `SELECT id, name, email, password_hash, role, customer_id, is_active
     FROM users WHERE lower(email) = lower($1)`,
    [parsed.data.email],
  );
  const user = result.rows[0];
  if (
    !user ||
    !user.is_active ||
    !(await compare(parsed.data.password, user.password_hash))
  ) {
    throw createError({
      statusCode: 401,
      statusMessage: "Неверная почта или пароль.",
    });
  }

  await startSession(event, Number(user.id));
  setResponseHeader(event, "Cache-Control", "no-store");
  return {
    user: {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: user.customer_id === null ? null : Number(user.customer_id),
    },
  };
});
