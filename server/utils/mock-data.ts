import { initialRequests } from "~/utils/requests";
import type {
  ApiCategory,
  ApiCustomer,
  ApiRequestRecord,
  ApiUser,
  CreateRequestPayload,
  RequestPriority,
  RequestStatus,
  SupportRequest,
  UpdateRequestPayload,
} from "~/types/request";

const requestRecords = structuredClone(initialRequests);
const requestVersions = new Map(
  requestRecords.map((request) => [request.id, 1]),
);
const updatedRequestIds = new Set<number>();

const uniqueValues = (values: string[]) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b, "ru"));

export const customers: ApiCustomer[] = uniqueValues(
  requestRecords.map((request) => request.client),
).map((name, index) => ({ id: index + 1, name }));

export const users: ApiUser[] = uniqueValues(
  requestRecords
    .map((request) => request.assignee)
    .filter((name) => name !== "Не назначен"),
).map((name, index) => ({
  id: index + 1,
  name,
  email: `operator${index + 1}@workflow.demo`,
  role: "Оператор",
}));

export const categories: ApiCategory[] = uniqueValues([
  ...requestRecords.map((request) => request.category),
  "Общее",
]).map((name, index) => ({ id: index + 1, name }));

function findIdByName(items: { id: number; name: string }[], name: string) {
  return items.find((item) => item.name === name)?.id ?? null;
}

export function getRequestRecords(): ApiRequestRecord[] {
  return requestRecords.map((request) => {
    const record: ApiRequestRecord = {
      id: request.id,
      version: requestVersions.get(request.id) ?? 1,
      title: request.title,
      client: request.client,
      customerId: findIdByName(customers, request.client),
      assignee: request.assignee,
      assigneeId: findIdByName(users, request.assignee),
      status: request.status,
      priority: request.priority,
      category: request.category,
      categoryId: findIdByName(categories, request.category),
      createdAt: request.createdAt,
      dueAt: request.dueAt,
      description: request.description,
      comments: request.comments,
      timeline: request.timeline,
    };

    if (request.id === 1030 && !updatedRequestIds.has(request.id)) {
      delete record.title;
      delete record.assignee;
    }

    return structuredClone(record);
  });
}

export function getRequestRecord(id: number) {
  return getRequestRecords().find((request) => request.id === id);
}

export function createRequestRecord(payload: CreateRequestPayload) {
  const now = new Date();
  const time = now.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const request: SupportRequest = {
    id: Math.max(0, ...requestRecords.map((item) => item.id)) + 1,
    title: payload.title.trim(),
    client: payload.client.trim(),
    assignee: "Не назначен",
    status: "Новая",
    priority: payload.priority,
    category: "Общее",
    createdAt: `Сегодня, ${time}`,
    dueAt: "Срок не назначен",
    description: payload.description.trim(),
    comments: [],
    timeline: [{ time, text: "Заявка создана" }],
  };
  requestRecords.unshift(request);
  requestVersions.set(request.id, 1);
  return getRequestRecord(request.id);
}

export function updateRequestRecord(
  id: number,
  expectedVersion: number,
  updates: Pick<UpdateRequestPayload, "status" | "priority" | "assignee">,
) {
  const request = requestRecords.find((item) => item.id === id);
  if (!request) return undefined;
  const currentVersion = requestVersions.get(id) ?? 1;
  if (currentVersion !== expectedVersion) return null;

  if (updates.status) request.status = updates.status;
  if (updates.priority) request.priority = updates.priority;
  if (updates.assignee !== undefined) {
    request.assignee = updates.assignee || "Не назначен";
    if (!updates.status) {
      request.status = updates.assignee ? "Назначена" : "Новая";
    }
  }

  const time = new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const changes = [
    updates.status ? `Изменён статус на «${updates.status}»` : "",
    updates.assignee !== undefined && !updates.status
      ? `Изменён статус на «${request.status}»`
      : "",
    updates.priority ? `Изменён приоритет на «${updates.priority}»` : "",
    updates.assignee !== undefined
      ? updates.assignee
        ? `${updates.assignee} назначен исполнителем`
        : "Исполнитель снят с заявки"
      : "",
  ].filter(Boolean);
  request.timeline.push(...changes.map((text) => ({ time, text })));
  requestVersions.set(id, currentVersion + 1);
  updatedRequestIds.add(id);
  return getRequestRecord(id);
}

export function addRequestComment(id: number, author: string, text: string) {
  const request = requestRecords.find((item) => item.id === id);
  if (!request) return undefined;
  const time = new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  request.comments.push({ author, time, text });
  request.timeline.push({ time, text: "Добавлен комментарий" });
  requestVersions.set(id, (requestVersions.get(id) ?? 1) + 1);
  updatedRequestIds.add(id);
  return getRequestRecord(id);
}

export function isRequestStatus(value: string): value is RequestStatus {
  return ["Новая", "Назначена", "Ожидает ответа", "Решена"].includes(value);
}

export function isRequestPriority(value: string): value is RequestPriority {
  return ["Низкий", "Обычный", "Высокий", "Критический"].includes(value);
}
