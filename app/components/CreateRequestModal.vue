<script setup lang="ts">
import type { CreateRequestPayload, RequestPriority } from "~/types/request";

defineProps<{ errorMessage?: string }>();
const emit = defineEmits<{
  close: [];
  create: [request: CreateRequestPayload];
}>();
const title = ref("");
const client = ref("");
const description = ref("");
const priority = ref<RequestPriority>("Обычный");
const dialog = ref<HTMLElement | null>(null);

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") emit("close");
  if (event.key !== "Tab" || !dialog.value) return;
  const focusable = [
    ...dialog.value.querySelectorAll<HTMLElement>(
      "button, input, textarea, select, a[href]",
    ),
  ].filter((element) => !element.hasAttribute("disabled"));
  const first = focusable.at(0);
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
  dialog.value?.querySelector<HTMLElement>("input")?.focus();
});
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));

function submit() {
  emit("create", {
    title: title.value.trim(),
    client: client.value.trim(),
    description: description.value.trim(),
    priority: priority.value,
  });
}
</script>

<template>
  <div class="modal-backdrop" @mousedown.self="emit('close')">
    <section
      ref="dialog"
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-title"
    >
      <div class="modal-heading">
        <div>
          <p class="eyebrow">НОВОЕ ОБРАЩЕНИЕ</p>
          <h2 id="create-title">Создать заявку</h2>
        </div>
        <button
          class="icon-button"
          type="button"
          aria-label="Закрыть"
          @click="emit('close')"
        >
          ×
        </button>
      </div>
      <form class="stack-form" @submit.prevent="submit">
        <p v-if="errorMessage" class="form-error" role="alert">
          {{ errorMessage }}
        </p>
        <label
          >Название заявки<input
            v-model="title"
            required
            maxlength="100"
            placeholder="Кратко опишите проблему"
        /></label>
        <label
          >Клиент<input
            v-model="client"
            required
            maxlength="80"
            placeholder="Название компании"
        /></label>
        <label
          >Приоритет<select v-model="priority">
            <option>Низкий</option>
            <option>Обычный</option>
            <option>Высокий</option>
            <option>Критический</option>
          </select></label
        >
        <label
          >Описание<textarea
            v-model="description"
            rows="4"
            required
            placeholder="Подробности обращения"
          ></textarea>
        </label>
        <div class="modal-actions">
          <button
            class="button button-outline"
            type="button"
            @click="emit('close')"
          >
            Отмена</button
          ><button class="button button-primary" type="submit">
            Создать заявку
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
