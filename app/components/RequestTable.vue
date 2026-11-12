<script setup lang="ts">
import type { SupportRequest } from "#shared/types/request";
defineProps<{ requests: SupportRequest[]; compact?: boolean }>();
</script>

<template>
  <div class="table-wrap">
    <table class="request-table">
      <thead>
        <tr>
          <th>Номер</th>
          <th>Заявка</th>
          <th>Клиент</th>
          <th>Исполнитель</th>
          <th>Статус</th>
          <th>Приоритет</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="request in requests" :key="request.id">
          <td>
            <NuxtLink class="request-number" :to="`/requests/${request.id}`"
              >#{{ request.id }}</NuxtLink
            >
          </td>
          <td>
            <NuxtLink class="request-title" :to="`/requests/${request.id}`">{{
              request.title
            }}</NuxtLink>
          </td>
          <td>{{ request.client }}</td>
          <td>{{ request.assignee }}</td>
          <td><StatusBadge :status="request.status" /></td>
          <td><PriorityBadge :priority="request.priority" /></td>
        </tr>
      </tbody>
    </table>
    <div class="request-cards">
      <NuxtLink
        v-for="request in requests"
        :key="request.id"
        class="request-card"
        :to="`/requests/${request.id}`"
      >
        <div class="request-card-top">
          <span class="request-number">#{{ request.id }}</span
          ><StatusBadge :status="request.status" />
        </div>
        <strong>{{ request.title }}</strong>
        <div class="request-card-bottom">
          <span>{{ request.client }}</span
          ><PriorityBadge :priority="request.priority" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
