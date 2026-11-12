<script setup lang="ts">
import type {
  ApiUser,
  RequestPriority,
  RequestSort,
  RequestStatus,
} from "#shared/types/request";

const search = defineModel<string>("search", { required: true });
const status = defineModel<RequestStatus | "">("status", { required: true });
const priority = defineModel<RequestPriority | "">("priority", {
  required: true,
});
const assignee = defineModel<string>("assignee", { required: true });
const sort = defineModel<RequestSort>("sort", { required: true });
defineProps<{ users: ApiUser[] }>();
const statuses: RequestStatus[] = [
  "Новая",
  "Назначена",
  "Ожидает ответа",
  "Решена",
];
const priorities: RequestPriority[] = [
  "Низкий",
  "Обычный",
  "Высокий",
  "Критический",
];
</script>

<template>
  <div class="filters" role="search">
    <label class="filter-field filter-search"
      ><span>Поиск</span
      ><input
        v-model="search"
        type="search"
        placeholder="Номер или название заявки"
    /></label>
    <label class="filter-field"
      ><span>Статус</span
      ><select v-model="status">
        <option value="">Все статусы</option>
        <option v-for="item in statuses" :key="item">{{ item }}</option>
      </select></label
    >
    <label class="filter-field"
      ><span>Приоритет</span
      ><select v-model="priority">
        <option value="">Все приоритеты</option>
        <option v-for="item in priorities" :key="item">{{ item }}</option>
      </select></label
    >
    <label class="filter-field"
      ><span>Назначение</span
      ><select v-model="assignee">
        <option value="">Все заявки</option>
        <option value="unassigned">Не назначен</option>
        <option v-for="user in users" :key="user.id" :value="user.name">
          {{ user.name }}
        </option>
      </select></label
    >
    <label class="filter-field"
      ><span>Сортировка</span
      ><select v-model="sort">
        <option value="newest">Сначала новые</option>
        <option value="oldest">Сначала старые</option>
        <option value="priority-high">Сначала важные</option>
        <option value="priority-low">Сначала обычные</option>
      </select></label
    >
  </div>
</template>
