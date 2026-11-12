import type {
  ApiRequestRecord,
  RequestLookups,
  RequestPriority,
  RequestStatus,
  SupportRequest,
} from "~/types/request";

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
    createdAt: record.createdAt ?? "Дата не указана",
    dueAt: record.dueAt ?? "Срок не назначен",
    description: record.description?.trim() || "Описание не указано.",
    comments: (record.comments ?? []).map((comment) => ({
      author: comment.author || "Оператор",
      time: comment.time || "",
      text: comment.text || "",
    })),
    timeline: (record.timeline ?? []).map((event) => ({
      time: event.time || "",
      text: event.text || "Изменение заявки",
    })),
  };
}
