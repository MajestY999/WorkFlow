<script setup lang="ts">
definePageMeta({ layout: "public" });
const menuOpen = ref(false);
</script>

<template>
  <div class="landing-frame">
    <header class="landing-header">
      <NuxtLink class="brand" to="/">WorkFlow</NuxtLink>
      <NuxtLink
        class="button button-outline button-small landing-login"
        to="/login"
      >
        Войти
      </NuxtLink>
      <button
        class="menu-toggle landing-menu-toggle"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="landing-nav"
        @click="menuOpen = !menuOpen"
      >
        <span class="sr-only">{{
          menuOpen ? "Закрыть меню" : "Открыть меню"
        }}</span>
        <span></span><span></span><span></span>
      </button>
      <nav
        id="landing-nav"
        :class="{ 'is-open': menuOpen }"
        aria-label="Навигация по сайту"
      >
        <a href="#features" @click="menuOpen = false">Статьи</a>
        <a href="#features" @click="menuOpen = false">Помощь</a>
        <a href="#features" @click="menuOpen = false">FAQ</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">ЗАЯВКИ · КОМАНДА · РЕЗУЛЬТАТ</p>
          <h1>Поддержка, в которой ничего не теряется</h1>
          <p class="hero-description">
            От первого обращения до решения — управляйте заявками, назначайте
            исполнителей и держите сроки под контролем.
          </p>
          <NuxtLink class="button button-primary" to="/login"
            >Начать работу</NuxtLink
          >
        </div>
        <div class="workflow-mark" aria-hidden="true">
          <span></span><span></span>
        </div>
      </section>
      <section class="steps-grid" aria-label="Как это работает">
        <article><b>01</b><span>Создайте заявку</span></article>
        <article><b>02</b><span>Назначьте исполнителя</span></article>
        <article><b>03</b><span>Подтвердите решение</span></article>
      </section>
      <section id="features" class="features">
        <h2>Одна система для всей команды</h2>
        <div class="feature-grid">
          <article>
            <strong>Все обращения рядом</strong>
            <p>Статусы, приоритеты и история общения.</p>
          </article>
          <article>
            <strong>Понятная ответственность</strong>
            <p>У каждой заявки есть исполнитель.</p>
          </article>
          <article>
            <strong>Контроль сроков</strong>
            <p>Сроки реакции и решения всегда видны.</p>
          </article>
        </div>
      </section>
    </main>
    <footer class="app-footer landing-footer">
      <span>WorkFlow © 2026</span>
      <div>
        <a href="#features">Помощь</a>
        <a href="#features">FAQ</a>
      </div>
    </footer>
  </div>
</template>
