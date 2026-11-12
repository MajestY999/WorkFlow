<script setup lang="ts">
import { getApiErrorMessage } from "~/utils/api-error";

const requestUi = useRequestUiStore();
const isRefreshing = ref(false);

async function refreshData() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await refreshNuxtData();
    requestUi.dismissNotice();
  } catch (error: unknown) {
    requestUi.showNotice(
      `Не удалось обновить данные: ${getApiErrorMessage(error)}`,
      "error",
    );
  } finally {
    isRefreshing.value = false;
  }
}
</script>

<template>
  <section
    v-if="requestUi.notice"
    class="request-action-notice"
    :class="`is-${requestUi.noticeKind}`"
    role="status"
    aria-live="polite"
  >
    <p>{{ requestUi.notice }}</p>
    <div class="request-action-notice-actions">
      <button
        v-if="requestUi.undoableChange && requestUi.noticeKind === 'success'"
        class="button button-outline button-small"
        type="button"
        :disabled="requestUi.undoPending"
        @click="requestUi.undoLastChange"
      >
        {{ requestUi.undoPending ? "Отменяем..." : "Отменить изменение" }}
      </button>
      <button
        v-if="requestUi.noticeKind === 'error'"
        class="button button-outline button-small"
        type="button"
        :disabled="isRefreshing"
        @click="refreshData"
      >
        {{ isRefreshing ? "Обновляем..." : "Обновить данные" }}
      </button>
      <button
        class="notice-dismiss"
        type="button"
        aria-label="Закрыть сообщение"
        @click="requestUi.dismissNotice"
      >
        ×
      </button>
    </div>
  </section>
</template>
