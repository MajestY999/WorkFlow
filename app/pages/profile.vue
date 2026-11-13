<script setup lang="ts">
import type { ListDensity } from "~/stores/preferences";
import { getApiErrorMessage } from "~/utils/api-error";

const authUser = useAuthUser();
const preferences = usePreferencesStore();
const name = ref("");
const email = ref("");
const profileError = ref("");
const isSaving = ref(false);
const saved = ref(false);
const logoutError = ref("");
const roleLabels = {
  Client: "Клиент",
  Operator: "Оператор",
  Agent: "Исполнитель",
  Admin: "Администратор",
} as const;
const initials = computed(() =>
  (authUser.value?.name ?? "Пользователь")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toLocaleUpperCase("ru"),
);

onMounted(preferences.hydrate);
watch(
  authUser,
  (user) => {
    name.value = user?.name ?? "";
    email.value = user?.email ?? "";
  },
  { immediate: true },
);

function changeDensity(event: Event) {
  const target = event.target;
  if (
    target instanceof HTMLSelectElement &&
    (target.value === "Комфортная" || target.value === "Компактная")
  ) {
    preferences.setDensity(target.value as ListDensity);
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

async function saveProfile() {
  profileError.value = "";
  saved.value = false;
  isSaving.value = true;
  try {
    const response = await $fetch<{ user: NonNullable<typeof authUser.value> }>(
      "/api/auth/profile",
      {
        method: "PATCH",
        body: { name: name.value, email: email.value },
      },
    );
    authUser.value = response.user;
    saved.value = true;
  } catch (failure: unknown) {
    profileError.value = getApiErrorMessage(failure);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="page-content profile-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">ВАША УЧЁТНАЯ ЗАПИСЬ</p>
        <h1>Профиль</h1>
        <p class="muted">Ваши данные и настройки интерфейса</p>
      </div>
    </div>
    <form class="panel profile-form" @submit.prevent="saveProfile">
      <div class="profile-card-heading">
        <span class="avatar avatar-large">{{ initials }}</span>
        <div class="profile-identity">
          <strong>{{ authUser?.name }}</strong>
          <span>{{ authUser?.email }}</span>
        </div>
        <span class="role-badge">
          <span></span>{{ roleLabels[authUser?.role ?? "Client"] }}
        </span>
      </div>
      <div class="profile-fields">
        <label>
          Имя
          <input
            v-model="name"
            required
            minlength="2"
            maxlength="120"
            autocomplete="name"
          />
        </label>
        <label>
          Электронная почта
          <input
            v-model="email"
            type="email"
            required
            maxlength="254"
            autocomplete="email"
          />
        </label>
      </div>
      <div class="profile-actions">
        <p v-if="profileError" class="form-error" role="alert">
          {{ profileError }}
        </p>
        <p v-else class="profile-helper">
          Это имя отображается в комментариях к заявкам.
        </p>
        <div class="profile-submit">
          <span v-if="saved" class="success-note" role="status"
            >Изменения сохранены</span
          >
          <button
            class="button button-primary"
            type="submit"
            :disabled="isSaving"
          >
            {{
              isSaving
                ? "Сохраняем..."
                : saved
                  ? "Сохранено"
                  : "Сохранить изменения"
            }}
          </button>
        </div>
      </div>
    </form>
    <section class="panel settings-panel">
      <div class="settings-copy">
        <span class="settings-icon" aria-hidden="true">☷</span>
        <div>
          <h2>Настройки интерфейса</h2>
          <p class="muted">Выберите удобное отображение списка заявок.</p>
        </div>
      </div>
      <label
        >Плотность списка
        <select :value="preferences.density" @change="changeDensity">
          <option>Комфортная</option>
          <option>Компактная</option>
        </select>
      </label>
      <span class="density-current"
        >Сейчас: {{ preferences.density.toLowerCase() }}</span
      >
    </section>
    <div class="profile-logout">
      <button class="button button-outline" type="button" @click="logout">
        Выйти из аккаунта
      </button>
    </div>
    <p v-if="logoutError" class="form-error" role="alert">{{ logoutError }}</p>
  </div>
</template>
