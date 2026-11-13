<script setup lang="ts">
import type { AuthSessionResponse } from "#shared/types/request";
import { getApiErrorMessage } from "~/utils/api-error";

definePageMeta({ layout: "public" });

const name = ref("");
const company = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const isSubmitting = ref(false);

async function register() {
  error.value = "";
  isSubmitting.value = true;
  try {
    const response = await $fetch<AuthSessionResponse>("/api/auth/register", {
      method: "POST",
      body: {
        name: name.value,
        company: company.value,
        email: email.value,
        password: password.value,
      },
    });
    useAuthUser().value = response.user;
    await navigateTo("/requests");
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
      <section class="login-card register-card">
        <h1>Создать аккаунт</h1>
        <p class="muted">Зарегистрируйтесь, чтобы отправлять заявки</p>
        <form class="stack-form" @submit.prevent="register">
          <label>
            Имя
            <input
              v-model="name"
              required
              minlength="2"
              maxlength="120"
              autocomplete="name"
              placeholder="Мария Смирнова"
            />
          </label>
          <label>
            Компания
            <input
              v-model="company"
              required
              minlength="2"
              maxlength="200"
              autocomplete="organization"
              placeholder="АО «Вектор»"
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
              placeholder="0000@mail.demo"
            />
          </label>
          <label>
            Пароль
            <input
              v-model="password"
              type="password"
              required
              minlength="8"
              maxlength="200"
              autocomplete="new-password"
              placeholder="Не менее 8 символов"
            />
          </label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button
            class="button button-primary"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Создаём аккаунт..." : "Зарегистрироваться" }}
          </button>
        </form>
        <NuxtLink class="text-link" to="/login"
          >Уже есть аккаунт? Войти</NuxtLink
        >
      </section>
    </main>
  </div>
</template>
