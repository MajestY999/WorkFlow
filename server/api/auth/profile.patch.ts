import { createError, readBody, setResponseHeader } from "h3";
import { z } from "zod";
import type { UserRole } from "#shared/types/request";
import { query } from "../../utils/database";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user!;
  const parsed = profileSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Укажите имя и корректный адрес электронной почты.",
    });
  }

  let result;
  try {
    result = await query<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      customer_id: string | null;
    }>(
      `UPDATE users
       SET name = $2, email = lower($3)
       WHERE id = $1 AND is_active = TRUE
       RETURNING id, name, email, role, customer_id`,
      [user.id, parsed.data.name, parsed.data.email],
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: "Этот адрес электронной почты уже используется.",
      });
    }
    throw error;
  }

  const updated = result.rows[0];
  if (!updated) {
    throw createError({
      statusCode: 404,
      statusMessage: "Учётная запись не найдена или отключена.",
    });
  }
  const response = {
    id: Number(updated.id),
    name: updated.name,
    email: updated.email,
    role: updated.role,
    customerId:
      updated.customer_id === null ? null : Number(updated.customer_id),
  };
  event.context.user = response;
  setResponseHeader(event, "Cache-Control", "no-store");
  return { user: response };
});
