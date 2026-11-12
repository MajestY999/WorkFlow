<script setup lang="ts">
import type { RequestStatus } from "#shared/types/request";
defineProps<{ status: RequestStatus }>();
const classes: Record<RequestStatus, string> = {
  Новая: "badge-new",
  Назначена: "badge-assigned",
  "Ожидает ответа": "badge-waiting",
  Решена: "badge-done",
};
</script>

<template>
  <span class="badge" :class="classes[status]"
    ><span class="badge-dot"></span>{{ status }}</span
  >
</template>
