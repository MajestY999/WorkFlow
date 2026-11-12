import { createError, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireRoles } from "../../utils/auth";
import { query } from "../../utils/database";

const userUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    role: z.enum(["Client", "Operator", "Agent", "Admin"]).optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);

export default defineEventHandler(async (event) => {
  const currentUser = event.context.user!;
  requireRoles(currentUser, ["Admin"]);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректный ID пользователя.",
    });
  }
  const parsed = userUpdateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Проверьте переданные поля пользователя.",
    });
  }
  if (
    id === currentUser.id &&
    (parsed.data.active === false ||
      (parsed.data.role !== undefined && parsed.data.role !== "Admin"))
  ) {
    throw createError({
      statusCode: 409,
      statusMessage:
        "Нельзя отключить или понизить роль текущей учётной записи администратора.",
    });
  }

  const result = await query<{
    id: string;
    name: string;
    email: string;
    role: "Client" | "Operator" | "Agent" | "Admin";
    is_active: boolean;
  }>(
    `UPDATE users
     SET name = COALESCE($2, name),
         role = COALESCE($3, role),
         is_active = COALESCE($4, is_active)
     WHERE id = $1
     RETURNING id, name, email, role, is_active`,
    [
      id,
      parsed.data.name ?? null,
      parsed.data.role ?? null,
      parsed.data.active ?? null,
    ],
  );
  const updated = result.rows[0];
  if (!updated)
    throw createError({
      statusCode: 404,
      statusMessage: "Пользователь не найден.",
    });
  return {
    id: Number(updated.id),
    name: updated.name,
    email: updated.email,
    role: updated.role,
    active: updated.is_active,
  };
});
