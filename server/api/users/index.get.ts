import { getQuery, createError } from "h3";
import { z } from "zod";
import { requireRoles } from "../../utils/auth";
import { query } from "../../utils/database";

export default defineEventHandler(async (event) => {
  const parsed = z
    .object({ includeInactive: z.enum(["true", "false"]).optional() })
    .safeParse(getQuery(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректные параметры пользователей.",
    });
  }
  const user = event.context.user!;
  const includeInactive = parsed.data.includeInactive === "true";
  if (includeInactive) requireRoles(user, ["Operator", "Admin"]);
  const result = await query<{
    id: string;
    name: string;
    email: string;
    role: "Client" | "Operator" | "Agent" | "Admin";
    is_active: boolean;
  }>(
    `SELECT id, name, email, role, is_active FROM users
     WHERE role IN ('Agent', 'Operator', 'Admin')
       AND ($1::boolean OR is_active = TRUE)
     ORDER BY name`,
    [includeInactive],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.is_active,
  }));
});
