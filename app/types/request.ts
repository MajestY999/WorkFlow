export type RequestStatus = "Новая" | "Назначена" | "Ожидает ответа" | "Решена";
export type RequestPriority = "Низкий" | "Обычный" | "Высокий" | "Критический";

export interface RequestComment {
  author: string;
  time: string;
  text: string;
}

export interface RequestEvent {
  time: string;
  text: string;
}

export interface SupportRequest {
  id: number;
  title: string;
  client: string;
  assignee: string;
  status: RequestStatus;
  priority: RequestPriority;
  category: string;
  createdAt: string;
  dueAt: string;
  description: string;
  comments: RequestComment[];
  timeline: RequestEvent[];
}

export type RequestSort =
  | "newest"
  | "oldest"
  | "priority-high"
  | "priority-low";

export interface ApiRequestComment {
  author?: string | null;
  time?: string | null;
  text?: string | null;
}

export interface ApiRequestEvent {
  time?: string | null;
  text?: string | null;
}

export interface ApiRequestRecord {
  id: number;
  version?: number;
  title?: string | null;
  client?: string | null;
  customerId?: number | null;
  assignee?: string | null;
  assigneeId?: number | null;
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  categoryId?: number | null;
  createdAt?: string | null;
  dueAt?: string | null;
  description?: string | null;
  comments?: ApiRequestComment[] | null;
  timeline?: ApiRequestEvent[] | null;
}

export interface RequestListResponse {
  items: ApiRequestRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: Record<RequestStatus, number>;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ApiCustomer {
  id: number;
  name: string;
}

export interface ApiCategory {
  id: number;
  name: string;
}

export interface RequestLookups {
  users: ApiUser[];
  customers: ApiCustomer[];
  categories: ApiCategory[];
}

export interface CreateRequestPayload {
  title: string;
  client: string;
  description: string;
  priority: RequestPriority;
}

export interface UpdateRequestPayload {
  expectedVersion: number;
  status?: RequestStatus;
  priority?: RequestPriority;
  assignee?: string | null;
}

export interface CreateCommentPayload {
  text: string;
  author?: string;
}
