import { defineStore } from "pinia";
import type {
  ApiRequestRecord,
  RequestPriority,
  RequestStatus,
} from "#shared/types/request";
import { getApiErrorMessage, getApiErrorStatus } from "~/utils/api-error";

type UndoableField = "status" | "priority";
type UndoableValue = RequestStatus | RequestPriority;

interface UndoableChange {
  requestId: number;
  field: UndoableField;
  previousValue: UndoableValue;
  value: UndoableValue;
  expectedVersion: number;
}

export const useRequestUiStore = defineStore("request-ui", () => {
  const notice = ref("");
  const noticeKind = ref<"success" | "error">("success");
  const undoableChange = ref<UndoableChange | null>(null);
  const undoPending = ref(false);

  function showNotice(message: string, kind: "success" | "error" = "success") {
    undoableChange.value = null;
    notice.value = message;
    noticeKind.value = kind;
  }

  function rememberChange(change: UndoableChange) {
    undoableChange.value = change;
    notice.value = `${change.field === "priority" ? "Приоритет" : "Статус"} изменён на «${change.value}»`;
    noticeKind.value = "success";
  }

  function dismissNotice() {
    notice.value = "";
    undoableChange.value = null;
  }

  async function undoLastChange() {
    const change = undoableChange.value;
    if (!change || undoPending.value) return;

    undoPending.value = true;
    try {
      await $fetch<ApiRequestRecord>(`/api/requests/${change.requestId}`, {
        method: "PATCH",
        body: {
          expectedVersion: change.expectedVersion,
          [change.field]: change.previousValue,
        },
      });
      undoableChange.value = null;
      showNotice("Последнее изменение отменено.");
    } catch (error: unknown) {
      const status = getApiErrorStatus(error);
      undoableChange.value = null;
      showNotice(
        status === 409
          ? "Не удалось отменить изменение: заявку уже изменил другой оператор. Обновите данные."
          : status === 500
            ? "Не удалось отменить изменение из-за ошибки сервера. Обновите заявку и попробуйте снова."
            : getApiErrorMessage(error),
        "error",
      );
      undoPending.value = false;
      return;
    }

    try {
      await refreshNuxtData();
    } catch (error: unknown) {
      showNotice(
        `Изменение отменено, но не удалось обновить данные: ${getApiErrorMessage(error)}`,
        "error",
      );
    } finally {
      undoPending.value = false;
    }
  }

  return {
    notice,
    noticeKind,
    undoableChange,
    undoPending,
    showNotice,
    rememberChange,
    dismissNotice,
    undoLastChange,
  };
});
