import { query } from "../../utils/database";

export default defineEventHandler(async (event) => {
  const user = event.context.user!;
  if (user.role === "Client" && user.customerId === null) return [];
  const result = await query<{ id: string; name: string }>(
    `SELECT id, name FROM customers
     WHERE $1::bigint IS NULL OR id = $1
     ORDER BY name`,
    [user.role === "Client" ? user.customerId : null],
  );
  return result.rows.map((row) => ({ id: Number(row.id), name: row.name }));
});
