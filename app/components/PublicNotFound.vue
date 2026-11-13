<script setup lang="ts">
defineProps<{
  entity: string;
  listPath: string;
  listLabel: string;
}>();
</script>

<template>
  <main class="public-not-found">
    <strong>404</strong>
    <h1>{{ entity }} не найдена</h1>
    <p>Возможно, страница удалена или её адрес изменился.</p>
    <NuxtLink class="button button-primary" :to="listPath">
      {{ listLabel }}
    </NuxtLink>
  </main>
</template>
