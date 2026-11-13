<script setup lang="ts">
const route = useRoute();
const menuOpen = ref(false);
const links = [
  { label: "Главная", to: "/" },
  { label: "Статьи", to: "/articles" },
  { label: "Помощь", to: "/help" },
  { label: "FAQ", to: "/faq" },
];

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  },
);
</script>

<template>
  <header class="public-header" @keydown.esc="menuOpen = false">
    <NuxtLink class="brand" to="/">WorkFlow</NuxtLink>
    <nav
      id="public-navigation"
      class="public-navigation"
      :class="{ 'is-open': menuOpen }"
      aria-label="Основная навигация"
    >
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :aria-current="route.path === link.to ? 'page' : undefined"
        @click="menuOpen = false"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>
    <NuxtLink
      class="button button-outline button-small public-login"
      to="/login"
    >
      Войти
    </NuxtLink>
    <button
      class="menu-toggle public-menu-toggle"
      type="button"
      :aria-expanded="menuOpen"
      aria-controls="public-navigation"
      @click="menuOpen = !menuOpen"
    >
      <span class="sr-only">{{
        menuOpen ? "Закрыть меню" : "Открыть меню"
      }}</span>
      <span /><span /><span />
    </button>
  </header>
</template>
