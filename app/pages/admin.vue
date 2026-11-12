<script setup lang="ts">
definePageMeta({ layout: "default" });
</script>

<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <p class="eyebrow">АДМИНИСТРИРОВАНИЕ</p>
        <h1>Панель администратора</h1>
        <p class="muted">Доступ к странице проверяется серверным роут-мидлваром.</p>
      </div>
    </div>
    <section class="panel">
      <h2>Пользователи и роли</h2>
      <p class="muted">Административные операции с пользователями доступны только через защищённый API.</p>
    </section>
  </div>
</template>
