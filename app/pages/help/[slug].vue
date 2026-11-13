<script setup lang="ts">
import { helpArticles, helpCategories } from "#shared/data/public-content";

definePageMeta({ layout: "public" });
const route = useRoute();
const slug = String(route.params.slug);
const category = helpCategories.find((item) => item.slug === slug);
if (!category) {
  setResponseStatus(404);
}
const articles = helpArticles.filter((item) => item.categorySlug === slug);
usePublicSeo(
  category
    ? `${category.title} — Центр помощи WorkFlow`
    : "Раздел не найден — WorkFlow",
  category
    ? `${category.description}. Инструкции и ответы в центре помощи WorkFlow.`
    : "Запрошенный раздел центра помощи не найден.",
  !category,
);
</script>

<template>
  <div class="knowledge-frame">
    <PublicHeader />
    <PublicNotFound
      v-if="!category"
      entity="Раздел"
      list-path="/help"
      list-label="В центр помощи"
    />
    <main v-else class="knowledge-content help-category-content">
      <NuxtLink class="back-link" to="/help">Центр помощи</NuxtLink>
      <header class="knowledge-heading">
        <h1>{{ category.title }}</h1>
        <p>{{ category.description }}</p>
      </header>
      <section class="instruction-list">
        <NuxtLink
          v-for="article in articles"
          :key="article.slug"
          class="knowledge-card instruction-card"
          :to="`/articles/${article.slug}`"
        >
          <strong>{{ article.title }}</strong>
          <span>{{ category.title }} · {{ article.readingTime }} минуты</span>
        </NuxtLink>
      </section>
    </main>
  </div>
</template>
