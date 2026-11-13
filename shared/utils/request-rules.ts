import type { RequestStatus } from "../types/request";

const validTransitions: Record<RequestStatus, readonly RequestStatus[]> = {
  Новая: ["Назначена", "Решена"],
  Назначена: ["Новая", "Ожидает ответа", "Решена"],
  "Ожидает ответа": ["Новая", "Назначена", "Решена"],
  Решена: [],
};

export function canTransitionRequestStatus(
  current: RequestStatus,
  next: RequestStatus,
) {
  return current === next || validTransitions[current].includes(next);
}
