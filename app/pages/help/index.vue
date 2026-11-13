<script setup lang="ts">
import { helpArticles, helpCategories } from "#shared/data/public-content";

definePageMeta({ layout: "public" });
usePublicSeo(
  "Центр помощи — WorkFlow",
  "Найдите ответ в базе знаний WorkFlow или изучите инструкции по работе с заявками.",
);
const search = ref("");
const filteredArticles = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("ru");
  if (!query) return helpArticles;
  return helpArticles.filter((item) =>
    `${item.title} ${item.categoryTitle}`
      .toLocaleLowerCase("ru")
      .includes(query),
  );
});
</script>

<template>
  <div class="knowledge-frame">
    <PublicHeader />
    <main class="knowledge-content help-content">
      <header class="knowledge-heading">
        <h1>Центр помощи</h1>
        <p>Найдите ответ или отправьте обращение</p>
      </header>
      <label class="knowledge-search">
        <span>Поиск</span>
        <input
          v-model="search"
          type="search"
          placeholder="Поиск по базе знаний"
        >
      </label>
      <section class="category-grid" aria-label="Разделы помощи">
        <article
          v-for="category in helpCategories"
          :key="category.slug"
          class="knowledge-card category-card"
        >
          <h2>{{ category.title }}</h2>
          <p>{{ category.description }}</p>
          <NuxtLink class="text-link" :to="`/help/${category.slug}`">
            Открыть
          </NuxtLink>
        </article>
      </section>
      <section class="popular-instructions">
        <h2>Популярные инструкции</h2>
        <div class="instruction-list">
          <NuxtLink
            v-for="article in filteredArticles"
            :key="article.slug"
            class="knowledge-card instruction-card"
            :to="`/articles/${article.slug}`"
          >
            <strong>{{ article.title }}</strong>
            <span>{{ article.categoryTitle }} · {{ article.readingTime }} минуты</span>
          </NuxtLink>
          <p v-if="filteredArticles.length === 0" class="knowledge-empty">
            По вашему запросу ничего не найдено.
          </p>
        </div>
      </section>
      <NuxtLink class="button button-primary help-cta" to="/login">
        Создать заявку
      </NuxtLink>
    </main>
  </div>
</template>
