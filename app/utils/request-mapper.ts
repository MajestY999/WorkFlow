import type {
  ApiRequestRecord,
  RequestLookups,
  RequestPriority,
  RequestStatus,
  SupportRequest,
} from "#shared/types/request";

const requestStatuses: RequestStatus[] = [
  "Новая",
  "Назначена",
  "Ожидает ответа",
  "Решена",
];
const requestPriorities: RequestPriority[] = [
  "Низкий",
  "Обычный",
  "Высокий",
  "Критический",
];

function formatRequestDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function mapApiRequest(
  record: ApiRequestRecord,
  lookups?: RequestLookups,
): SupportRequest {
  const status = requestStatuses.find((item) => item === record.status);
  const priority = requestPriorities.find((item) => item === record.priority);

  return {
    id: record.id,
    title: record.title?.trim() || "Без названия",
    client:
      lookups?.customers.find((item) => item.id === record.customerId)?.name ??
      record.client ??
      "Клиент не указан",
    assignee:
      lookups?.users.find((item) => item.id === record.assigneeId)?.name ??
      record.assignee ??
      "Не назначен",
    status: status ?? "Новая",
    priority: priority ?? "Обычный",
    category:
      lookups?.categories.find((item) => item.id === record.categoryId)?.name ??
      record.category ??
      "Без категории",
    createdAt: record.createdAt
      ? formatRequestDateTime(record.createdAt)
      : "Дата не указана",
    dueAt: record.dueAt ?? "Срок не назначен",
    description: record.description?.trim() || "Описание не указано.",
    comments: (record.comments ?? []).map((comment) => ({
      author: comment.author || "Оператор",
      time: comment.time ? formatRequestDateTime(comment.time) : "",
      text: comment.text || "",
    })),
    timeline: (record.timeline ?? []).map((event) => ({
      time: event.time ? formatRequestDateTime(event.time) : "",
      text: event.text || "Изменение заявки",
    })),
  };
}
