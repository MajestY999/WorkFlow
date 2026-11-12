<script setup lang="ts">
import type { ListDensity } from "~/stores/preferences";

const name = ref('Анна Кузнецова')
const email = ref('0000@mail.demo')
const preferences = usePreferencesStore()
const saved = ref(false)
let savedTimeout: ReturnType<typeof setTimeout> | undefined
function saveProfile() {
  saved.value = true
  clearTimeout(savedTimeout)
  savedTimeout = setTimeout(() => { saved.value = false }, 2500)
}
onBeforeUnmount(() => clearTimeout(savedTimeout))
onMounted(preferences.hydrate)
function changeDensity(event: Event) {
  const target = event.target
  if (target instanceof HTMLSelectElement && (target.value === 'Комфортная' || target.value === 'Компактная')) {
    preferences.setDensity(target.value as ListDensity)
  }
}
</script>

<template>
  <div class="page-content profile-page">
    <div class="page-heading"><div><p class="eyebrow">ВАША УЧЁТНАЯ ЗАПИСЬ</p><h1>Профиль</h1><p class="muted">Ваши данные и настройки интерфейса</p></div></div>
    <form class="panel profile-form" @submit.prevent="saveProfile">
      <div class="profile-card-heading">
        <span class="avatar avatar-large">АК</span>
        <div class="profile-identity"><strong>{{ name || 'Ваше имя' }}</strong><span>{{ email || 'Электронная почта не указана' }}</span></div>
        <span class="role-badge"><span></span>Оператор</span>
      </div>
      <div class="profile-fields">
        <label>Имя<input v-model="name" required autocomplete="name" /></label>
        <label>Электронная почта<input v-model="email" type="email" required autocomplete="email" /></label>
      </div>
      <div class="profile-actions"><p class="profile-helper">Эти данные используются в комментариях к заявкам.</p><div class="profile-submit"><span v-if="saved" class="success-note" role="status">Изменения сохранены</span><button class="button button-primary" type="submit">{{ saved ? 'Сохранено' : 'Сохранить изменения' }}</button></div></div>
    </form>
    <section class="panel settings-panel">
      <div class="settings-copy"><span class="settings-icon" aria-hidden="true">☷</span><div><h2>Настройки интерфейса</h2><p class="muted">Выберите удобное отображение списка заявок.</p></div></div>
      <label>Плотность списка<select :value="preferences.density" @change="changeDensity"><option>Комфортная</option><option>Компактная</option></select></label>
      <span class="density-current">Сейчас: {{ preferences.density.toLowerCase() }}</span>
    </section>
    <div class="profile-logout"><div><strong>Завершить работу?</strong><span>Вы вернётесь на главную страницу.</span></div><NuxtLink class="button button-outline" to="/">Выйти из аккаунта</NuxtLink></div>
  </div>
</template>
