<script setup lang="ts">
import type { RequestPriority } from "~/types/request";
defineProps<{ priority: RequestPriority }>();
const symbols: Record<RequestPriority, string> = {
  Низкий: "↓",
  Обычный: "═",
  Высокий: "⌃",
  Критический: "△",
};
</script>

<template>
  <span class="priority" :class="`priority-${priority.toLowerCase()}`"
    ><span aria-hidden="true">{{ symbols[priority] }}</span
    >{{ priority }}</span
  >
</template>
