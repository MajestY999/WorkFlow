<script setup lang="ts">
import type { AuthSessionResponse } from "#shared/types/request";
import { getApiErrorMessage } from "~/utils/api-error";

definePageMeta({ layout: "public" });
const route = useRoute();
const email = ref("");
const password = ref("");
const error = ref("");
const isSubmitting = ref(false);

async function signIn() {
  error.value = "";
  isSubmitting.value = true;
  try {
    const response = await $fetch<AuthSessionResponse>("/api/auth/login", {
      method: "POST",
      body: { email: email.value, password: password.value },
    });
    useAuthUser().value = response.user;
    const redirect =
      typeof route.query.redirect === "string"
        ? route.query.redirect
        : "/dashboard";
    await navigateTo(
      redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/dashboard",
    );
  } catch (failure: unknown) {
    error.value = getApiErrorMessage(failure);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="login-frame">
    <header class="login-header">
      <NuxtLink class="brand" to="/">WorkFlow</NuxtLink>
    </header>
    <main class="login-content">
      <section class="login-card">
        <h1>С возвращением</h1>
        <p class="muted">Войдите для работы с заявками</p>
        <p
          v-if="route.query.reason === 'session-expired'"
          class="api-notice"
          role="status"
        >
          Сессия истекла. Войдите снова, чтобы продолжить работу.
        </p>
        <form class="stack-form" @submit.prevent="signIn">
          <label
            >Электронная почта<input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="operator@workflow.local"
          /></label>
          <label
            >Пароль<input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="Введите пароль"
          /></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button
            class="button button-primary"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Входим..." : "Войти" }}
          </button>
        </form>
        <NuxtLink class="text-link" to="/register"
          >Нет аккаунта? Зарегистрироваться</NuxtLink
        >
      </section>
    </main>
  </div>
</template>
