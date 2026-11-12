<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode?: number;
    statusMessage?: string;
    message?: string;
  };
}>();

const code = computed(() => props.error.statusCode ?? 500);
const isForbidden = computed(() => code.value === 403);
const heading = computed(() =>
  isForbidden.value ? "Нет доступа" : "Не удалось открыть страницу",
);
const description = computed(
  () =>
    props.error.statusMessage ??
    (isForbidden.value
      ? "Эта страница недоступна вашей роли."
      : "Произошла ошибка. Попробуйте вернуться к заявкам."),
);
</script>

<template>
  <main class="error-page">
    <strong>{{ code }}</strong>
    <h1>{{ heading }}</h1>
    <p>{{ description }}</p>
    <button
      class="button button-primary"
      type="button"
      @click="clearError({ redirect: '/requests' })"
    >
      Вернуться к заявкам
    </button>
  </main>
</template>
