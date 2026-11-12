<script setup lang="ts">
import { getApiErrorMessage } from "~/utils/api-error";

const route = useRoute();
const authUser = useAuthUser();
const menuOpen = ref(false);
const notificationsOpen = ref(false);
const logoutError = ref("");
const roleLabels = {
  Client: "Клиент",
  Operator: "Оператор",
  Agent: "Исполнитель",
  Admin: "Администратор",
} as const;
const userInitials = computed(() =>
  (authUser.value?.name ?? "Пользователь")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toLocaleUpperCase("ru"),
);
const links = [
  { label: "Обзор", to: "/dashboard" },
  { label: "Заявки", to: "/requests" },
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

async function logout() {
  logoutError.value = "";
  try {
    await logoutUser();
  } catch (failure: unknown) {
    logoutError.value = getApiErrorMessage(failure);
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
        </button>
        <section
          v-if="notificationsOpen"
          id="notifications-panel"
          class="notification-panel"
          aria-label="Последние уведомления"
        >
          <div class="notification-heading">
            <strong>Уведомления</strong>
          </div>
          <p class="notification-empty">Пока нет уведомлений</p>
        </section>
      </div>
      <NuxtLink
        class="profile-link"
        to="/profile"
        :aria-label="`Профиль: ${authUser?.name ?? 'пользователь'}`"
        :aria-current="route.path === '/profile' ? 'page' : undefined"
        @click="menuOpen = false"
      >
        <span class="avatar">{{ userInitials }}</span>
        <span class="profile-name">{{
          roleLabels[authUser?.role ?? "Operator"]
        }}</span>
      </NuxtLink>
      <button class="profile-link logout-button" type="button" @click="logout">
        Выйти
      </button>
      <p v-if="logoutError" class="form-error header-error" role="alert">
        {{ logoutError }}
      </p>
    </nav>
  </header>
</template>
