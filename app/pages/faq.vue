<script setup lang="ts">
import { frequentlyAskedQuestions } from "#shared/data/public-content";

definePageMeta({ layout: "public" });
usePublicSeo(
  "Частые вопросы — WorkFlow",
  "Ответы на вопросы о работе с сервисными заявками WorkFlow.",
);
const search = ref("");
const filteredQuestions = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("ru");
  if (!query) return frequentlyAskedQuestions;
  return frequentlyAskedQuestions.filter((item) =>
    `${item.question} ${item.answer}`.toLocaleLowerCase("ru").includes(query),
  );
});
</script>

<template>
  <div class="knowledge-frame">
    <PublicHeader />
    <main class="knowledge-content faq-content">
      <header class="knowledge-heading">
        <h1>Частые вопросы</h1>
        <p>Ответы о работе с сервисными заявками</p>
      </header>
      <label class="knowledge-search">
        <span>Поиск по вопросам</span>
        <input
          v-model="search"
          type="search"
          placeholder="Что вы хотите узнать?"
        >
      </label>
      <section class="faq-list" aria-label="Часто задаваемые вопросы">
        <article
          v-for="item in filteredQuestions"
          :key="item.question"
          class="knowledge-card faq-card"
        >
          <h2>{{ item.question }}</h2>
          <p>{{ item.answer }}</p>
        </article>
        <p v-if="filteredQuestions.length === 0" class="knowledge-empty">
          По вашему запросу ничего не найдено.
        </p>
      </section>
    </main>
  </div>
</template>
