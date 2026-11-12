import { createError } from "h3";
import type {
  ApiRequestRecord,
  AuthUser,
  RequestListResponse,
  RequestPriority,
  RequestStatus,
} from "#shared/types/request";
import type { QueryResultRow } from "pg";
import { query } from "./database";

export interface RequestRow extends QueryResultRow {
  id: string;
  version: number;
  title: string;
  customer_id: string;
  client: string;
  assignee_id: string | null;
  assignee: string | null;
  status: RequestStatus;
  priority: RequestPriority;
  category_id: string;
  category: string;
  created_at: string;
  due_at: string;
  description: string;
  comments: ApiRequestRecord["comments"];
  timeline: ApiRequestRecord["timeline"];
}

const requestSelection = `
  SELECT r.id, r.version, r.title, r.customer_id, c.name AS client,
         r.assignee_id, a.name AS assignee, r.status, r.priority,
         r.category_id, cat.name AS category, r.created_at, r.due_at,
         r.description,
         COALESCE((
           SELECT json_agg(json_build_object(
             'author', COALESCE(author.name, rc.author_name),
             'time', rc.created_at, 'text', rc.body
           ) ORDER BY rc.id)
           FROM request_comments rc
           LEFT JOIN users author ON author.id = rc.author_user_id
           WHERE rc.request_id = r.id
         ), '[]'::json) AS comments,
         COALESCE((
           SELECT json_agg(json_build_object(
             'time', rt.created_at, 'text', rt.message
           ) ORDER BY rt.id)
           FROM request_timeline rt WHERE rt.request_id = r.id
         ), '[]'::json) AS timeline
  FROM requests r
  JOIN customers c ON c.id = r.customer_id
  JOIN categories cat ON cat.id = r.category_id
  LEFT JOIN users a ON a.id = r.assignee_id`;

export function mapRequestRow(row: RequestRow): ApiRequestRecord {
  return {
    id: Number(row.id),
    version: row.version,
    title: row.title,
    client: row.client,
    customerId: Number(row.customer_id),
    assignee: row.assignee ?? "Не назначен",
    assigneeId: row.assignee_id === null ? null : Number(row.assignee_id),
    status: row.status,
    priority: row.priority,
    category: row.category,
    categoryId: Number(row.category_id),
    createdAt: row.created_at,
    dueAt: row.due_at,
    description: row.description,
    comments: row.comments ?? [],
    timeline: row.timeline ?? [],
  };
}

export function visibilityClause(user: AuthUser, startAt: number) {
  if (user.role === "Client") {
    return { sql: `r.requester_user_id = $${startAt}`, values: [user.id] };
  }
  if (user.role === "Agent") {
    return { sql: `r.assignee_id = $${startAt}`, values: [user.id] };
  }
  return { sql: "TRUE", values: [] as number[] };
}

export async function getRequestForUser(id: number, user: AuthUser) {
  const visibility = visibilityClause(user, 2);
  const result = await query<RequestRow>(
    `${requestSelection} WHERE r.id = $1 AND ${visibility.sql}`,
    [id, ...visibility.values],
  );
  const row = result.rows[0];
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Заявка не найдена." });
  }
  return mapRequestRow(row);
}

export interface RequestListFilters {
  q?: string;
  status?: RequestStatus;
  priority?: RequestPriority;
  assignee?: string;
  sort?: string;
  page: number;
  pageSize: number;
}

export async function listRequestsForUser(
  user: AuthUser,
  filters: RequestListFilters,
): Promise<RequestListResponse> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  const add = (clause: (placeholder: string) => string, value: unknown) => {
    values.push(value);
    clauses.push(clause(`$${values.length}`));
  };

  if (user.role === "Client") add((p) => `r.requester_user_id = ${p}`, user.id);
  if (user.role === "Agent") add((p) => `r.assignee_id = ${p}`, user.id);
  if (filters.status) add((p) => `r.status = ${p}`, filters.status);
  if (filters.priority) add((p) => `r.priority = ${p}`, filters.priority);
  if (filters.assignee === "unassigned") {
    clauses.push("r.assignee_id IS NULL");
  } else if (filters.assignee) {
    add((p) => `a.name = ${p}`, filters.assignee);
  }
  if (filters.q) {
    add(
      (p) =>
        `position(lower(${p}) in lower(concat_ws(' ', r.id, r.title, c.name, a.name, cat.name))) > 0`,
      filters.q.toLocaleLowerCase("ru"),
    );
  }

  const where = clauses.length ? clauses.join(" AND ") : "TRUE";
  const from = `FROM requests r
    JOIN customers c ON c.id = r.customer_id
    JOIN categories cat ON cat.id = r.category_id
    LEFT JOIN users a ON a.id = r.assignee_id`;
  const countResult = await query<{ total: string }>(
    `SELECT count(*)::text AS total ${from} WHERE ${where}`,
    values,
  );
  const statusResult = await query<{ status: RequestStatus; total: string }>(
    `SELECT r.status, count(*)::text AS total ${from} WHERE ${where} GROUP BY r.status`,
    values,
  );
  const total = Number(countResult.rows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const orderBy =
    filters.sort === "oldest"
      ? "r.id ASC"
      : filters.sort === "priority-high"
        ? `CASE r.priority WHEN 'Критический' THEN 4 WHEN 'Высокий' THEN 3 WHEN 'Обычный' THEN 2 ELSE 1 END DESC, r.id DESC`
        : filters.sort === "priority-low"
          ? `CASE r.priority WHEN 'Критический' THEN 4 WHEN 'Высокий' THEN 3 WHEN 'Обычный' THEN 2 ELSE 1 END ASC, r.id DESC`
          : "r.id DESC";
  const pageValues = [
    ...values,
    filters.pageSize,
    (page - 1) * filters.pageSize,
  ];
  const itemsResult = await query<RequestRow>(
    `${requestSelection} WHERE ${where} ORDER BY ${orderBy}
     LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
    pageValues,
  );
  const statusCounts: Record<RequestStatus, number> = {
    Новая: 0,
    Назначена: 0,
    "Ожидает ответа": 0,
    Решена: 0,
  };
  for (const row of statusResult.rows)
    statusCounts[row.status] = Number(row.total);

  return {
    items: itemsResult.rows.map(mapRequestRow),
    total,
    page,
    pageSize: filters.pageSize,
    totalPages,
    statusCounts,
  };
}
