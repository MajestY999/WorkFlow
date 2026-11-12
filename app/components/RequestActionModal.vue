<script setup lang="ts">
import type {
  ApiUser,
  RequestStatus,
  UpdateRequestPayload,
} from "#shared/types/request";

type ActionMode = "assign" | "status";

const props = defineProps<{
  mode: ActionMode;
  currentStatus: RequestStatus;
  users: ApiUser[];
  busy?: boolean;
  serverError?: string;
}>();
const emit = defineEmits<{
  close: [];
  save: [
    payload: Pick<
      UpdateRequestPayload,
      "assignee" | "assigneeId" | "status" | "comment" | "reason"
    >,
  ];
}>();

const dialog = ref<HTMLElement | null>(null);
const assignee = ref("");
const allowedStatuses: Record<RequestStatus, readonly RequestStatus[]> = {
  Новая: ["Назначена", "Решена"],
  Назначена: ["Новая", "Ожидает ответа", "Решена"],
  "Ожидает ответа": ["Новая", "Назначена", "Решена"],
  Решена: [],
};
const status = ref<RequestStatus>(
  allowedStatuses[props.currentStatus][0] ?? props.currentStatus,
);
const reason = ref("");
const comment = ref("");
const validationError = ref("");

const titles: Record<ActionMode, string> = {
  assign: "Назначить исполнителя",
  status: "Изменить статус",
};
const descriptions: Record<ActionMode, string> = {
  assign: "Выберите активного сотрудника.",
  status: "Доступные действия зависят от текущего статуса.",
};
const targetStatus = computed<RequestStatus | undefined>(() => {
  if (props.mode === "status") return status.value;
  return undefined;
});
const reasonRequired = computed(
  () =>
    props.mode === "status" &&
    targetStatus.value !== props.currentStatus &&
    (targetStatus.value === "Ожидает ответа" ||
      targetStatus.value === "Решена"),
);

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && !props.busy) emit("close");
  if (event.key !== "Tab" || !dialog.value) return;
  const focusable = [
    ...dialog.value.querySelectorAll<HTMLElement>(
      "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)",
    ),
  ];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
  dialog.value?.querySelector<HTMLElement>("select, textarea")?.focus();
});
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));

watch(
  () => props.currentStatus,
  (value) => {
    status.value = allowedStatuses[value][0] ?? value;
  },
);

function submit() {
  validationError.value = "";
  if (props.mode === "assign") {
    if (!assignee.value) {
      validationError.value = "Выберите исполнителя.";
      return;
    }
    const selectedUser = props.users.find(
      (user) => user.id === Number(assignee.value),
    );
    if (!selectedUser) {
      validationError.value = "Выберите исполнителя из списка.";
      return;
    }
    emit("save", {
      assignee: selectedUser.name,
      assigneeId: selectedUser.id,
      comment: comment.value.trim() || undefined,
    });
    return;
  }
  if (!targetStatus.value || targetStatus.value === props.currentStatus) {
    validationError.value = "Выберите новый статус.";
    return;
  }
  if (reasonRequired.value && !reason.value.trim()) {
    validationError.value =
      targetStatus.value === "Ожидает ответа"
        ? "Укажите причину ожидания."
        : "Опишите результат решения.";
    return;
  }
  emit("save", {
    status: targetStatus.value,
    reason: reason.value.trim() || undefined,
  });
}
</script>

<template>
  <div class="modal-backdrop" @mousedown.self="!busy && emit('close')">
    <section
      ref="dialog"
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-action-title"
    >
      <div class="modal-heading">
        <div>
          <h2 id="request-action-title">{{ titles[mode] }}</h2>
          <p class="muted action-description">{{ descriptions[mode] }}</p>
        </div>
        <button
          class="icon-button"
          type="button"
          aria-label="Закрыть"
          :disabled="busy"
          @click="emit('close')"
        >
          ×
        </button>
      </div>
      <form class="stack-form" @submit.prevent="submit">
        <template v-if="mode === 'assign'">
          <label>
            Исполнитель
            <select v-model="assignee" required>
              <option value="">Не назначен</option>
              <option
                v-for="user in users.filter((item) => item.role === 'Agent')"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }}{{ user.active ? "" : " — деактивирован" }}
              </option>
            </select>
          </label>
          <label>
            Комментарий
            <input
              v-model="comment"
              maxlength="2000"
              placeholder="Например: проверьте права доступа"
            />
          </label>
        </template>
        <template v-else>
          <label v-if="mode === 'status'">
            Текущий статус
            <input :value="currentStatus" readonly />
          </label>
          <label v-if="mode === 'status'">
            Новый статус
            <select v-model="status" required>
              <option
                v-for="option in allowedStatuses[currentStatus]"
                :key="option"
              >
                {{ option }}
              </option>
            </select>
          </label>
          <label v-if="reasonRequired">
            {{
              targetStatus === "Ожидает ответа"
                ? "Причина ожидания"
                : "Результат решения"
            }}
            <textarea
              v-model="reason"
              rows="4"
              maxlength="2000"
              :aria-invalid="Boolean(validationError && reasonRequired)"
            ></textarea>
          </label>
          <p v-else-if="mode === 'status'" class="muted">
            Для статусов «Ожидает ответа» и «Решена» потребуется указать
            причину.
          </p>
        </template>
        <p v-if="validationError" class="form-error" role="alert">
          {{ validationError }}
        </p>
        <p
          v-if="serverError"
          class="form-error action-server-error"
          role="alert"
        >
          {{ serverError }}
        </p>
        <div class="modal-actions">
          <button
            class="button button-outline"
            type="button"
            :disabled="busy"
            @click="emit('close')"
          >
            Отмена
          </button>
          <button
            class="button button-primary"
            type="submit"
            :disabled="
              busy ||
              (mode === 'assign' &&
                !users.some((user) => user.role === 'Agent' && user.active))
            "
          >
            {{
              busy
                ? "Сохраняем..."
                : mode === "assign"
                  ? "Назначить"
                  : "Сохранить"
            }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
