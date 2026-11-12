import { hash } from "bcryptjs";
import { initialRequests } from "../../shared/data/requests";
import { ensureDatabase, withTransaction } from "../utils/database";

const defaultPasswords = {
  admin: process.env.WORKFLOW_ADMIN_PASSWORD ?? "Admin123!",
  operator: process.env.WORKFLOW_OPERATOR_PASSWORD ?? "Operator123!",
  agent: process.env.WORKFLOW_AGENT_PASSWORD ?? "Agent123!",
  client: process.env.WORKFLOW_CLIENT_PASSWORD ?? "Client123!",
};

if (process.env.NODE_ENV === "production") {
  throw new Error("The development seed script cannot run in production.");
}

await ensureDatabase();

await withTransaction(async (client) => {
  const customerNames = [
    ...new Set(initialRequests.map((item) => item.client)),
  ];
  const categoryNames = [
    ...new Set(initialRequests.map((item) => item.category)),
  ];
  const customers = new Map<string, number>();
  const categories = new Map<string, number>();
  const userIds = new Map<string, number>();
  const userNames = new Map<string, string>();

  for (const name of customerNames) {
    const result = await client.query<{ id: string }>(
      `INSERT INTO customers (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name],
    );
    customers.set(name, Number(result.rows[0].id));
  }
  for (const name of categoryNames) {
    const result = await client.query<{ id: string }>(
      `INSERT INTO categories (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name],
    );
    categories.set(name, Number(result.rows[0].id));
  }

  const accounts = [
    {
      name: "Администратор WorkFlow",
      email: "admin@workflow.local",
      role: "Admin",
      password: defaultPasswords.admin,
      customerId: null,
    },
    {
      name: "Анна Кузнецова",
      email: "operator@workflow.local",
      role: "Operator",
      password: defaultPasswords.operator,
      customerId: null,
    },
    {
      name: "Брунгильда Б.",
      email: "agent.brungilda@workflow.local",
      role: "Agent",
      password: defaultPasswords.agent,
      customerId: null,
    },
    {
      name: "Олег С.",
      email: "agent.oleg@workflow.local",
      role: "Agent",
      password: defaultPasswords.agent,
      customerId: null,
    },
    ...customerNames.map((name, index) => ({
      name: `Клиент ${name}`,
      email: `client${index + 1}@workflow.local`,
      role: "Client",
      password: defaultPasswords.client,
      customerId: customers.get(name) ?? null,
    })),
  ];

  for (const account of accounts) {
    const passwordHash = await hash(account.password, 12);
    const result = await client.query<{ id: string }>(
      `INSERT INTO users (name, email, password_hash, role, customer_id)
       VALUES ($1, lower($2), $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         customer_id = EXCLUDED.customer_id,
         is_active = TRUE
       RETURNING id`,
      [
        account.name,
        account.email,
        passwordHash,
        account.role,
        account.customerId,
      ],
    );
    userIds.set(account.name, Number(result.rows[0].id));
    userNames.set(account.name, account.name);
  }

  for (const item of initialRequests) {
    const created = await client.query<{ id: string }>(
      `INSERT INTO requests (
         id, title, customer_id, requester_user_id, assignee_id, status,
         priority, category_id, created_at, due_at, description
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [
        item.id,
        item.title,
        customers.get(item.client),
        userIds.get(`Клиент ${item.client}`),
        item.assignee === "Не назначен" ? null : userIds.get(item.assignee),
        item.status,
        item.priority,
        categories.get(item.category),
        item.createdAt,
        item.dueAt,
        item.description,
      ],
    );
    if (created.rowCount === 0) continue;

    for (const comment of item.comments) {
      const requesterName = `Клиент ${item.client}`;
      const authorName = userNames.has(comment.author)
        ? comment.author
        : requesterName;
      const authorId =
        userIds.get(comment.author) ?? userIds.get(requesterName) ?? null;
      await client.query(
        `INSERT INTO request_comments (
           request_id, author_user_id, author_name, body, created_at
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [item.id, authorId, authorName, comment.text, comment.time],
      );
    }
    for (const entry of item.timeline) {
      const requesterName = `Клиент ${item.client}`;
      const actorName =
        [...userNames.keys()].find((name) => entry.text.startsWith(name)) ??
        requesterName;
      await client.query(
        `INSERT INTO request_timeline (
           request_id, actor_user_id, message, created_at
         )
         VALUES ($1, $2, $3, $4)`,
        [item.id, userIds.get(actorName) ?? null, entry.text, entry.time],
      );
    }
  }
  await client.query(
    `SELECT setval(
       pg_get_serial_sequence('requests', 'id'),
       GREATEST(COALESCE((SELECT MAX(id) FROM requests), 1), 1),
       EXISTS (SELECT 1 FROM requests)
     )`,
  );
});

console.info("WorkFlow seed data is ready.");
