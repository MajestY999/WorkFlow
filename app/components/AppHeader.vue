<script setup lang="ts">
const route = useRoute();
const menuOpen = ref(false);
const notificationsOpen = ref(false);
const links = [
  { label: "Обзор", to: "/dashboard" },
  { label: "Заявки", to: "/requests" },
];
const notifications = [
  {
    title: "Новая заявка #1042",
    detail: "Не работает доступ к CRM",
    time: "5 минут назад",
  },
  {
    title: "Назначен исполнитель",
    detail: "Заявка #1040 — Брунгильда Б.",
    time: "Вчера",
  },
];

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
    notificationsOpen.value = false;
  },
);

function closeOverlaysOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") {
    menuOpen.value = false;
    notificationsOpen.value = false;
  }
}
</script>

<template>
  <header class="topbar" @keydown="closeOverlaysOnEscape">
    <NuxtLink class="brand" to="/dashboard" aria-label="WorkFlow — обзор"
      >WorkFlow</NuxtLink
    >
    <button
      class="menu-toggle"
      type="button"
      :aria-expanded="menuOpen"
      aria-controls="primary-nav"
      @click="menuOpen = !menuOpen"
    >
      <span class="sr-only">{{
        menuOpen ? "Закрыть меню" : "Открыть меню"
      }}</span>
      <span></span><span></span><span></span>
    </button>
    <nav
      id="primary-nav"
      class="main-nav"
      :class="{ 'is-open': menuOpen }"
      aria-label="Основная навигация"
    >
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :aria-current="route.path.startsWith(link.to) ? 'page' : undefined"
        @click="menuOpen = false"
      >
        {{ link.label }}
      </NuxtLink>
      <div class="notification-wrap">
        <button
          class="notification-button"
          type="button"
          :aria-expanded="notificationsOpen"
          aria-controls="notifications-panel"
          aria-label="Уведомления"
          @click="notificationsOpen = !notificationsOpen"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
          <span class="notification-count" aria-label="2 новых уведомления"
            >2</span
          >
        </button>
        <section
          v-if="notificationsOpen"
          id="notifications-panel"
          class="notification-panel"
          aria-label="Последние уведомления"
        >
          <div class="notification-heading">
            <strong>Уведомления</strong><span>2 новых</span>
          </div>
          <NuxtLink
            v-for="(notification, index) in notifications"
            :key="notification.title"
            class="notification-item"
            :to="`/requests/${index === 0 ? 1042 : 1040}`"
          >
            <span class="notification-dot"></span>
            <span
              ><strong>{{ notification.title }}</strong
              ><small>{{ notification.detail }}</small
              ><time>{{ notification.time }}</time></span
            >
          </NuxtLink>
          <NuxtLink class="notification-all" to="/requests"
            >Перейти к заявкам <span aria-hidden="true">→</span></NuxtLink
          >
        </section>
      </div>
      <NuxtLink
        class="profile-link"
        to="/profile"
        aria-label="Профиль оператора Анны Кузнецовой"
        :aria-current="route.path === '/profile' ? 'page' : undefined"
        @click="menuOpen = false"
      >
        <span class="avatar">АК</span><span class="profile-name">Оператор</span>
      </NuxtLink>
    </nav>
  </header>
</template>
