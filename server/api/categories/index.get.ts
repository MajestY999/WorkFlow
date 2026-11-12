import { query } from "../../utils/database";

export default defineEventHandler(async () => {
  const result = await query<{ id: string; name: string }>(
    "SELECT id, name FROM categories ORDER BY name",
  );
  return result.rows.map((row) => ({ id: Number(row.id), name: row.name }));
});
