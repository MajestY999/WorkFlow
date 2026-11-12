<script setup lang="ts">
import type { RequestStatus, SupportRequest } from "~/types/request";
const props = defineProps<{
  requests: SupportRequest[];
  counts?: Record<RequestStatus, number>;
}>();
const stats = computed(() => [
  {
    label: "Новые заявки",
    value:
      props.counts?.["Новая"] ??
      props.requests.filter((item) => item.status === "Новая").length,
    note: "Ожидают назначения",
  },
  {
    label: "В работе",
    value:
      props.counts?.["Назначена"] ??
      props.requests.filter((item) => item.status === "Назначена").length,
    note: "Назначены исполнителям",
  },
  {
    label: "Ожидают ответа",
    value:
      props.counts?.["Ожидает ответа"] ??
      props.requests.filter((item) => item.status === "Ожидает ответа").length,
    note: "Нужна информация",
  },
  {
    label: "Решены",
    value:
      props.counts?.["Решена"] ??
      props.requests.filter((item) => item.status === "Решена").length,
    note: "За эту неделю",
  },
]);
</script>

<template>
  <div class="stats-grid">
    <article v-for="stat in stats" :key="stat.label" class="stat-card">
      <span>{{ stat.label }}</span
      ><strong>{{ stat.value }}</strong
      ><small>{{ stat.note }}</small>
    </article>
  </div>
</template>
