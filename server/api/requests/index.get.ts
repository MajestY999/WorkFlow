import { createError, getQuery, setResponseHeader } from "h3";
import {
  applyDemoNetworkBehavior,
  getStringQuery,
} from "../../utils/api-request";
import {
  getRequestRecords,
  isRequestPriority,
  isRequestStatus,
} from "../../utils/mock-data";
import type {
  RequestListResponse,
  RequestPriority,
  RequestStatus,
} from "~/types/request";

const priorityWeight: Record<RequestPriority, number> = {
  Низкий: 1,
  Обычный: 2,
  Высокий: 3,
  Критический: 4,
};
const priorityRank = (value?: string | null) =>
  value && isRequestPriority(value) ? priorityWeight[value] : 0;

export default defineEventHandler(
  async (event): Promise<RequestListResponse> => {
    await applyDemoNetworkBehavior(event);

    const query = getQuery(event);
    const search = (getStringQuery(query.q) ?? "")
      .trim()
      .toLocaleLowerCase("ru")
      .slice(0, 100);
    const statusValue = getStringQuery(query.status);
    const priorityValue = getStringQuery(query.priority);
    const assignee = getStringQuery(query.assignee);
    const sort = getStringQuery(query.sort) ?? "newest";
    const page = Math.max(
      1,
      Number.parseInt(getStringQuery(query.page) ?? "1", 10) || 1,
    );
    const pageSize = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(getStringQuery(query.pageSize) ?? "12", 10) || 12,
      ),
    );
    const allRecords = getRequestRecords();

    const statusCounts: Record<RequestStatus, number> = {
      Новая: 0,
      Назначена: 0,
      "Ожидает ответа": 0,
      Решена: 0,
    };
    for (const record of allRecords) {
      if (record.status && isRequestStatus(record.status))
        statusCounts[record.status]++;
    }

    const filtered = allRecords.filter((record) => {
      const text = [
        record.id,
        record.title,
        record.client,
        record.assignee,
        record.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ru");
      return (
        (!search || text.includes(search)) &&
        (!statusValue ||
          !isRequestStatus(statusValue) ||
          record.status === statusValue) &&
        (!priorityValue ||
          !isRequestPriority(priorityValue) ||
          record.priority === priorityValue) &&
        (!assignee ||
          (assignee === "unassigned"
            ? !record.assignee || record.assignee === "Не назначен"
            : record.assignee === assignee))
      );
    });
    if (getStringQuery(query.demo) === "empty") filtered.length = 0;

    filtered.sort((left, right) => {
      if (sort === "oldest") return left.id - right.id;
      if (sort === "priority-high") {
        return (
          priorityRank(right.priority) - priorityRank(left.priority) ||
          right.id - left.id
        );
      }
      if (sort === "priority-low") {
        return (
          priorityRank(left.priority) - priorityRank(right.priority) ||
          right.id - left.id
        );
      }
      return right.id - left.id;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    setResponseHeader(event, "Cache-Control", "no-store");

    return {
      items: filtered.slice(start, start + pageSize),
      total,
      page: currentPage,
      pageSize,
      totalPages,
      statusCounts,
    };
  },
);
