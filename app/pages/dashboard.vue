<script setup lang="ts">
import type { RequestListResponse } from "#shared/types/request";
import { mapApiRequest } from "~/utils/request-mapper";

const { data } = await useFetch<RequestListResponse>("/api/requests", {
  query: { page: 1, pageSize: 100 },
  default: () => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 100,
    totalPages: 1,
    statusCounts: {
      Новая: 0,
      Назначена: 0,
      "Ожидает ответа": 0,
      Решена: 0,
    },
  }),
});
const lookups = await useRequestLookups();
const requests = computed(() =>
  data.value.items.map((item) =>
    mapApiRequest(item, {
      users: lookups.users.value,
      customers: lookups.customers.value,
      categories: lookups.categories.value,
    }),
  ),
);
const latest = computed(() => requests.value.slice(0, 3));
</script>

<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <p class="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</p>
        <h1>Обзор</h1>
        <p class="muted">Обзор работы поддержки</p>
      </div>
      <NuxtLink class="button button-primary" to="/requests">
        Все заявки
      </NuxtLink>
    </div>
    <RequestStats :requests="requests" :counts="data.statusCounts" />
    <section class="section-block">
      <div class="section-heading">
        <h2>Последние заявки</h2>
        <NuxtLink class="text-link" to="/requests">
          Посмотреть все <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
      <RequestTable :requests="latest" />
    </section>
  </div>
</template>
