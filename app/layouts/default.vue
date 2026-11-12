<script setup lang="ts">
const preferences = usePreferencesStore();
const requestUi = useRequestUiStore();

onMounted(preferences.hydrate);
</script>

<template>
  <div class="app-shell">
    <div
      class="app-frame"
      :class="{ 'density-compact': preferences.density === 'Компактная' }"
    >
      <AppHeader />
      <main class="app-main">
        <div v-if="requestUi.notice" class="page-content app-notices">
          <RequestActionNotice />
        </div>
        <slot />
      </main>
    </div>
  </div>
</template>
