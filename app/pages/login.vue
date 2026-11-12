<script setup lang="ts">
definePageMeta({ layout: 'public' })
const email = ref('')
const password = ref('')
const error = ref('')
function signIn() {
  if (!email.value.includes('@')) { error.value = 'Введите корректный адрес электронной почты.'; return }
  error.value = ''
  navigateTo('/dashboard')
}
</script>

<template>
  <div class="login-frame">
    <header class="login-header"><NuxtLink class="brand" to="/">WorkFlow</NuxtLink></header>
    <main class="login-content">
      <section class="login-card">
        <h1>С возвращением</h1><p class="muted">Войдите для работы с заявками</p>
        <form class="stack-form" @submit.prevent="signIn">
          <label>Электронная почта<input v-model="email" type="email" required autocomplete="email" placeholder="0000@mail.demo" /></label>
          <label>Пароль<input v-model="password" type="password" required autocomplete="current-password" placeholder="Введите пароль" /></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="button button-primary" type="submit">Войти</button>
        </form>
        <p class="login-note">Демо-режим: используйте любой email и пароль.</p>
        <NuxtLink class="text-link" to="/dashboard">Перейти к заявкам без входа</NuxtLink>
      </section>
    </main>
  </div>
</template>
