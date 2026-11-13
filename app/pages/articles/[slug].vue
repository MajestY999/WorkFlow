<script setup lang="ts">
import { helpArticles } from "#shared/data/public-content";

definePageMeta({ layout: "public" });
const route = useRoute();
const slug = String(route.params.slug);
const article = helpArticles.find((item) => item.slug === slug);
const feedback = ref<"yes" | "no" | null>(null);
if (!article) {
  setResponseStatus(404);
}
usePublicSeo(
  article ? `${article.title} — WorkFlow` : "Статья не найдена — WorkFlow",
  article
    ? article.introduction
    : "Запрошенная статья не найдена. Откройте список инструкций WorkFlow.",
  !article,
);
</script>

<template>
  <div class="knowledge-frame">
    <PublicHeader />
    <PublicNotFound
      v-if="!article"
      entity="Статья"
      list-path="/articles"
      list-label="К списку статей"
    />
    <main v-else class="knowledge-content article-content">
      <header class="article-heading">
        <h1>{{ article.title }}</h1>
        <p>{{ article.categoryTitle }} · Обновлено {{ article.updatedAt }}</p>
      </header>
      <article class="knowledge-card article-body">
        <h2>Перед началом</h2>
        <p>{{ article.introduction }}</p>
        <section
          v-for="(step, index) in article.steps"
          :key="step.title"
          class="article-step"
        >
          <h2>{{ index + 1 }}. {{ step.title }}</h2>
          <p>{{ step.description }}</p>
        </section>
        <section class="article-feedback" aria-label="Оценка статьи">
          <h2>Была ли статья полезна?</h2>
          <button
            class="button button-outline button-small"
            type="button"
            :aria-pressed="feedback === 'yes'"
            @click="feedback = 'yes'"
          >
            Да
          </button>
          <button
            class="button button-outline button-small"
            type="button"
            :aria-pressed="feedback === 'no'"
            @click="feedback = 'no'"
          >
            Нет
          </button>
          <p v-if="feedback" role="status">Спасибо за отзыв.</p>
        </section>
      </article>
    </main>
  </div>
</template>
