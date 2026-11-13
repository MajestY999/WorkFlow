<script setup lang="ts">
import type {
  ApiUser,
  ApiRequestRecord,
  RequestPriority,
  RequestStatus,
  SupportRequest,
  UpdateRequestPayload,
} from "#shared/types/request";
import { getApiErrorMessage, getApiErrorStatus } from "~/utils/api-error";
import { mapApiRequest } from "~/utils/request-mapper";
import { createSingleFlight } from "~/utils/request-async";

const route = useRoute();
const requestUi = useRequestUiStore();
const authUser = useAuthUser();
const isSaving = ref(false);
const isSendingComment = ref(false);
const actionMode = ref<"assign" | "status" | null>(null);
const actionUsers = ref<ApiUser[]>([]);
const actionError = ref("");
const comment = ref("");
const commentError = ref("");
const commentSuccess = ref("");
const postComment = createSingleFlight((requestId: number, text: string) =>
  $fetch<ApiRequestRecord>(`/api/requests/${requestId}/comments`, {
    method: "POST",
    body: { text },
  }),
);

const { data, pending, error, refresh } = await useFetch<ApiRequestRecord>(
  () => `/api/requests/${route.params.id}`,
);
watch(
  error,
  async (failure) => {
    if (!failure || getApiErrorStatus(failure) !== 401) return;
    authUser.value = null;
    await navigateTo({
      path: "/login",
      query: { redirect: route.fullPath, reason: "session-expired" },
    });
  },
  { immediate: true },
);
const lookups = await useRequestLookups();
const request = computed<SupportRequest | null>(() =>
  data.value
    ? mapApiRequest(data.value, {
        users: lookups.users.value,
        customers: lookups.customers.value,
        categories: lookups.categories.value,
      })
    : null,
);
const requestError = computed(() =>
  error.value ? getApiErrorMessage(error.value) : "",
);
function currentTime() {
  return new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSelectValue(event: Event) {
  return event.target instanceof HTMLSelectElement ? event.target.value : "";
}

function isRequestPriority(value: string): value is RequestPriority {
  return ["Низкий", "Обычный", "Высокий", "Критический"].includes(value);
}

function updateFailureMessage(failure: unknown) {
  const status = getApiErrorStatus(failure);
  if (status === 409) {
    return "Изменение не сохранено. Заявка уже изменена другим оператором; предыдущее значение восстановлено. Обновите заявку и попробуйте снова.";
  }
  if (status === 500) {
    return "Изменение не сохранено из-за временной ошибки сервера; предыдущее значение восстановлено. Попробуйте ещё раз.";
  }
  return `Изменение не сохранено; предыдущее значение восстановлено. ${getApiErrorMessage(failure)}`;
}

async function updateRequest(
  changes: Pick<
    UpdateRequestPayload,
    "status" | "priority" | "assignee" | "assigneeId"
  >,
  undo?:
    | {
        field: "status";
        previousValue: RequestStatus;
        value: RequestStatus;
      }
    | {
        field: "priority";
        previousValue: RequestPriority;
        value: RequestPriority;
      },
      metadata: Pick<UpdateRequestPayload, "comment" | "reason"> = {},
): Promise<boolean> {
      const previous = data.value;
      if (!previous || isSaving.value) return false;

  const expectedVersion = previous.version ?? 1;
  const nextStatus =
    changes.assigneeId !== undefined && changes.status === undefined
      ? changes.assigneeId !== null
        ? "Назначена"
        : "Новая"
      : changes.status;
  const timelineEntries = [
    nextStatus ? `Изменён статус на «${nextStatus}»` : "",
    changes.priority ? `Изменён приоритет на «${changes.priority}»` : "",
    changes.assigneeId !== undefined
      ? changes.assignee
        ? `${changes.assignee} назначен исполнителем`
        : "Исполнитель снят с заявки"
      : "",
  ].filter(Boolean);
  const updatedAt = currentTime();
  const optimistic: ApiRequestRecord = {
    ...previous,
    ...changes,
    status: nextStatus ?? previous.status,
    assignee:
      changes.assignee === null
        ? "Не назначен"
        : (changes.assignee ?? previous.assignee),
    version: expectedVersion,
    timeline: [
      ...(previous.timeline ?? []),
      ...timelineEntries.map((text) => ({ time: updatedAt, text })),
    ],
  };
  data.value = optimistic;
  isSaving.value = true;
  commentError.value = "";

  let updated: ApiRequestRecord;
  try {
    updated = await $fetch<ApiRequestRecord>(`/api/requests/${previous.id}`, {
      method: "PATCH",
      body: { ...changes, ...metadata, expectedVersion },
    });
  } catch (failure: unknown) {
    data.value = previous;
    if (getApiErrorStatus(failure) === 401) {
      isSaving.value = false;
      useAuthUser().value = null;
      await navigateTo({
        path: "/login",
        query: { redirect: route.fullPath, reason: "session-expired" },
      });
      return false;
    }
    actionError.value = getApiErrorMessage(failure);
    requestUi.showNotice(updateFailureMessage(failure), "error");
    isSaving.value = false;
    return false;
  }

  data.value = updated;
  if (undo) {
    requestUi.rememberChange({
      requestId: updated.id,
      field: undo.field,
      previousValue: undo.previousValue,
      value: undo.value,
      expectedVersion: updated.version ?? expectedVersion + 1,
    });
  } else {
    requestUi.showNotice("Изменения заявки сохранены.");
  }
  try {
    await refreshNuxtData();
  } catch (failure: unknown) {
    requestUi.showNotice(
      `Изменение сохранено, но данные на других экранах не обновились: ${getApiErrorMessage(failure)}`,
      "error",
    );
  } finally {
    isSaving.value = false;
  }
  return true;
}

function changePriority(event: Event) {
  if (!request.value) return;
  const value = getSelectValue(event);
  if (!isRequestPriority(value) || value === request.value.priority) return;
  void updateRequest(
    { priority: value },
    {
      field: "priority",
      previousValue: request.value.priority,
      value,
    },
  );
}

async function openAction(
  mode: "assign" | "status",
) {
  actionError.value = "";
  actionUsers.value = lookups.users.value;
  if (
    mode === "assign" &&
    (authUser.value?.role === "Operator" || authUser.value?.role === "Admin")
  ) {
    try {
      actionUsers.value = await $fetch<ApiUser[]>("/api/users", {
        query: { includeInactive: "true" },
      });
    } catch (failure: unknown) {
      actionError.value = getApiErrorMessage(failure);
      return;
    }
  }
  actionMode.value = mode;
}

async function saveAction(
  payload: Pick<
    UpdateRequestPayload,
    "assignee" | "assigneeId" | "status" | "comment" | "reason"
  >,
) {
  actionError.value = "";
  const { comment: actionComment, reason, ...changes } = payload;
  const saved = await updateRequest(changes, undefined, {
    comment: actionComment,
    reason,
  });
  if (saved) actionMode.value = null;
}

async function sendComment() {
  if (!request.value || isSendingComment.value) return;
  const text = comment.value.trim();
  if (!text) {
    commentError.value = "Введите текст комментария.";
    return;
  }

  isSendingComment.value = true;
  commentError.value = "";
  commentSuccess.value = "";
  try {
    const updated = await postComment(request.value.id, text);
    data.value = updated;
    comment.value = "";
    commentSuccess.value = "Комментарий отправлен.";
    requestUi.dismissNotice();
  } catch (failure: unknown) {
    if (getApiErrorStatus(failure) === 401) {
      useAuthUser().value = null;
      await navigateTo({
        path: "/login",
        query: { redirect: route.fullPath, reason: "session-expired" },
      });
      return;
    }
    commentError.value = `Не удалось отправить комментарий. Текст сохранён — попробуйте ещё раз. ${getApiErrorMessage(failure)}`;
  } finally {
    isSendingComment.value = false;
  }
}
</script>

<template>
  <div class="page-content detail-page">
    <NuxtLink class="back-link" to="/requests">← К списку заявок</NuxtLink>
    <div
      v-if="pending"
      class="detail-grid detail-loading"
      aria-label="Загрузка заявки"
    >
      <div class="detail-main">
        <section v-for="panel in 3" :key="panel" class="panel">
          <div class="skeleton-list">
            <span v-for="row in panel === 2 ? 5 : 3" :key="row"></span>
          </div>
        </section>
      </div>
      <aside class="panel">
        <div class="skeleton-list">
          <span v-for="row in 6" :key="row"></span>
        </div>
      </aside>
    </div>
    <section v-else-if="error" class="panel detail-error" role="alert">
      <span class="state-icon" aria-hidden="true">ⓘ</span>
      <h1>
        {{
          error.statusCode === 404
            ? "Заявка не найдена"
            : "Не удалось загрузить заявку"
        }}
      </h1>
      <p>{{ requestError }}</p>
      <button
        v-if="error.statusCode !== 404"
        class="button button-primary"
        type="button"
        @click="() => refresh()"
      >
        Повторить загрузку
      </button>
      <NuxtLink v-else class="button button-primary" to="/requests">
        Вернуться к заявкам
      </NuxtLink>
    </section>
    <div v-else-if="request" class="detail-content">
      <div class="detail-heading">
        <div>
          <p class="eyebrow">
            ЗАЯВКА #{{ request.id }} · {{ request.createdAt }}
          </p>
          <h1>{{ request.title }}</h1>
          <div class="detail-badges">
            <StatusBadge :status="request.status" />
            <PriorityBadge :priority="request.priority" />
          </div>
        </div>
      </div>
      <p v-if="lookups.error.value" class="api-notice" role="status">
        Не удалось загрузить часть справочников. Для заявки показаны доступные
        данные.
      </p>
      <div class="detail-grid">
        <div class="detail-main">
          <section class="panel description-panel">
            <h2>Описание проблемы</h2>
            <p>{{ request.description }}</p>
          </section>
          <section class="panel comments-panel">
            <h2>Комментарии · {{ request.comments.length }}</h2>
            <div v-if="request.comments.length" class="comment-list">
              <article
                v-for="(item, index) in request.comments"
                :key="`${item.author}-${index}`"
                class="comment"
              >
                <div class="comment-meta">
                  <strong>{{ item.author }}</strong>
                  <time>{{ item.time }}</time>
                </div>
                <p>{{ item.text }}</p>
              </article>
            </div>
            <div v-else class="empty-comments">
              Комментариев пока нет. Будьте первым.
            </div>
            <form class="comment-form" @submit.prevent="sendComment">
              <label for="comment-input">Ваш комментарий</label>
              <textarea
                id="comment-input"
                v-model="comment"
                rows="3"
                maxlength="2000"
                placeholder="Напишите сообщение..."
              ></textarea>
              <p v-if="commentError" class="form-error" role="alert">
                {{ commentError }}
              </p>
              <p v-if="commentSuccess" class="success-note" role="status">
                {{ commentSuccess }}
              </p>
              <button
                class="button button-primary"
                type="submit"
                :disabled="isSendingComment || !comment.trim()"
              >
                {{
                  isSendingComment ? "Отправляем..." : "Отправить комментарий"
                }}
              </button>
            </form>
          </section>
          <section class="panel timeline-panel">
            <h2>История заявки</h2>
            <ol class="timeline">
              <li
                v-for="(item, index) in request.timeline"
                :key="`${item.time}-${index}`"
              >
                <span class="timeline-dot"></span>
                <time>{{ item.time }}</time>
                <p>{{ item.text }}</p>
              </li>
            </ol>
          </section>
        </div>
        <aside class="panel details-sidebar">
          <h2>Параметры</h2>
          <dl class="detail-properties">
            <div>
              <dt>Клиент</dt>
              <dd>{{ request.client }}</dd>
            </div>
            <div>
              <dt>Категория</dt>
              <dd>{{ request.category }}</dd>
            </div>
            <div>
              <dt>Статус</dt>
              <dd>
                <span>{{ request.status }}</span>
              </dd>
            </div>
            <div>
              <dt>Исполнитель</dt>
              <dd>
                <span>{{ request.assignee }}</span>
              </dd>
            </div>
            <div>
              <dt>Приоритет</dt>
              <dd>
                <select
                  v-if="
                    authUser?.role === 'Operator' || authUser?.role === 'Admin'
                  "
                  :value="request.priority"
                  aria-label="Приоритет"
                  :disabled="isSaving"
                  @change="changePriority"
                >
                  <option>Низкий</option>
                  <option>Обычный</option>
                  <option>Высокий</option>
                  <option>Критический</option>
                </select>
                <span v-else>{{ request.priority }}</span>
              </dd>
            </div>
            <div>
              <dt>Срок решения</dt>
              <dd class="deadline">{{ request.dueAt }}</dd>
            </div>
          </dl>
          <button
            v-if="authUser?.role === 'Operator' || authUser?.role === 'Admin'"
            class="button button-primary full-width assign-button"
            type="button"
            :disabled="isSaving"
            @click="openAction('assign')"
          >
            {{ request.assignee === "Не назначен" ? "Назначить исполнителя" : "Изменить исполнителя" }}
          </button>
          <div v-if="authUser?.role !== 'Client'" class="request-actions">
            <button
              v-if="request.status !== 'Решена'"
              class="button button-primary full-width"
              type="button"
              :disabled="isSaving"
              @click="openAction('status')"
            >
              Изменить статус
            </button>
          </div>
        </aside>
      </div>
    </div>
    <RequestActionModal
      v-if="actionMode && request"
      :mode="actionMode"
      :current-status="request.status"
      :users="actionUsers"
      :busy="isSaving"
      :server-error="actionError"
      @close="actionMode = null"
      @save="saveAction"
    />
  </div>
</template>
