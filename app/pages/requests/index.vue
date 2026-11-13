<script setup lang="ts">
import type {
  ApiRequestRecord,
  CreateRequestPayload,
  RequestListResponse,
  RequestPriority,
  RequestSort,
  RequestStatus,
} from "#shared/types/request";
import { getApiErrorMessage, getApiErrorStatus } from "~/utils/api-error";
import { mapApiRequest } from "~/utils/request-mapper";

const route = useRoute();
const router = useRouter();
const showCreate = ref(false);
const createError = ref("");
const createRefreshError = ref("");
const isCreating = ref(false);
const authUser = useAuthUser();
const pageSize = 12;

function queryValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isRequestStatus(value: string): value is RequestStatus {
  return ["Новая", "Назначена", "Ожидает ответа", "Решена"].includes(value);
}

function isRequestPriority(value: string): value is RequestPriority {
  return ["Низкий", "Обычный", "Высокий", "Критический"].includes(value);
}

function isRequestSort(value: string): value is RequestSort {
  return ["newest", "oldest", "priority-high", "priority-low"].includes(value);
}

const initialStatus = queryValue(route.query.status);
const initialPriority = queryValue(route.query.priority);
const initialSort = queryValue(route.query.sort);
const filters = reactive<{
  search: string;
  status: RequestStatus | "";
  priority: RequestPriority | "";
  assignee: string;
  sort: RequestSort;
}>({
  search: queryValue(route.query.q),
  status: isRequestStatus(initialStatus) ? initialStatus : "",
  priority: isRequestPriority(initialPriority) ? initialPriority : "",
  assignee: queryValue(route.query.assignee),
  sort: isRequestSort(initialSort) ? initialSort : "newest",
});
const debouncedSearch = useDebounce(toRef(filters, "search"), 350);
const searchIsDirty = computed(
  () => filters.search.trim() !== queryValue(route.query.q),
);
const lookups = await useRequestLookups();
const ownCustomer = computed(() =>
  lookups.customers.value.find(
    (customer) => customer.id === authUser.value?.customerId,
  ),
);
function currentPageFromQuery() {
  return Math.max(
    1,
    Number.parseInt(queryValue(route.query.page) || "1", 10) || 1,
  );
}

const requestQuery = computed(() => {
  const routeSearch = queryValue(route.query.q);
  const searchChanged = debouncedSearch.value !== routeSearch;
  return {
    q: debouncedSearch.value || undefined,
    status: queryValue(route.query.status) || undefined,
    priority: queryValue(route.query.priority) || undefined,
    assignee: queryValue(route.query.assignee) || undefined,
    sort: queryValue(route.query.sort) || "newest",
    page: searchChanged ? 1 : currentPageFromQuery(),
    pageSize,
  };
});

const { data, pending, error, refresh } = await useFetch<RequestListResponse>(
  "/api/requests",
  {
    query: requestQuery,
    dedupe: "cancel",
    default: () => ({
      items: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      statusCounts: {
        Новая: 0,
        Назначена: 0,
        "Ожидает ответа": 0,
        Решена: 0,
      },
    }),
  },
);

watch(
  error,
  async (failure) => {
    if (!failure || getApiErrorStatus(failure) !== 401) return;
    authUser.value = null;
    await navigateTo({
      path: "/login",
      query: { redirect: route.fullPath, reason: "session-expired" },
    });
  },
  { immediate: true },
);

const requests = computed(() =>
  data.value.items.map((item) =>
    mapApiRequest(item, {
      users: lookups.users.value,
      customers: lookups.customers.value,
      categories: lookups.categories.value,
    }),
  ),
);
const totalPages = computed(() => Math.max(1, data.value.totalPages));
const requestCountLabel = computed(() => {
  const count = data.value.total;
  const remainder100 = count % 100;
  const remainder10 = count % 10;
  const noun =
    remainder100 >= 11 && remainder100 <= 14
      ? "заявок"
      : remainder10 === 1
        ? "заявка"
        : remainder10 >= 2 && remainder10 <= 4
          ? "заявки"
          : "заявок";
  return `${count} ${noun}`;
});
const pageNumbers = computed(() =>
  Array.from({ length: totalPages.value }, (_, index) => index + 1),
);
const pageStart = computed(() =>
  data.value.total ? (data.value.page - 1) * pageSize + 1 : 0,
);
const pageEnd = computed(() =>
  Math.min(data.value.page * pageSize, data.value.total),
);
const errorMessage = computed(() =>
  error.value ? getApiErrorMessage(error.value) : "",
);
const lookupErrorMessage = computed(() =>
  lookups.error.value ? getApiErrorMessage(lookups.error.value) : "",
);

function updateQuery(patch: Record<string, string | number | undefined>) {
  const nextQuery = { ...route.query };
  let changed = false;

  for (const [key, value] of Object.entries(patch)) {
    const nextValue =
      value === undefined || value === "" ? undefined : String(value);
    if (queryValue(nextQuery[key]) === (nextValue ?? "")) continue;
    if (nextValue === undefined) Reflect.deleteProperty(nextQuery, key);
    else nextQuery[key] = nextValue;
    changed = true;
  }

  if (changed) void router.replace({ query: nextQuery });
}

watch(debouncedSearch, (search) => {
  updateQuery({ q: search.trim() || undefined, page: undefined });
});

watch(
  () => [filters.status, filters.priority, filters.assignee, filters.sort],
  () => {
    updateQuery({
      status: filters.status,
      priority: filters.priority,
      assignee: filters.assignee,
      sort: filters.sort === "newest" ? undefined : filters.sort,
      page: undefined,
    });
  },
);

watch(
  () => route.query,
  (query) => {
    const search = queryValue(query.q);
    const status = queryValue(query.status);
    const priority = queryValue(query.priority);
    const sort = queryValue(query.sort);
    if (filters.search.trim() !== search && !searchIsDirty.value) {
      filters.search = search;
    }
    if (filters.status !== (isRequestStatus(status) ? status : "")) {
      filters.status = isRequestStatus(status) ? status : "";
    }
    if (filters.priority !== (isRequestPriority(priority) ? priority : "")) {
      filters.priority = isRequestPriority(priority) ? priority : "";
    }
    if (filters.assignee !== queryValue(query.assignee)) {
      filters.assignee = queryValue(query.assignee);
    }
    if (filters.sort !== (isRequestSort(sort) ? sort : "newest")) {
      filters.sort = isRequestSort(sort) ? sort : "newest";
    }
  },
);

watch(
  () => data.value.page,
  (page) => {
    if (page !== currentPageFromQuery()) {
      updateQuery({ page: page === 1 ? undefined : page });
    }
  },
);

function goToPage(page: number) {
  updateQuery({ page: page === 1 ? undefined : page });
}

async function createRequest(payload: CreateRequestPayload) {
  if (isCreating.value) return;
  createError.value = "";
  createRefreshError.value = "";
  isCreating.value = true;
  try {
    await $fetch<ApiRequestRecord>("/api/requests", {
      method: "POST",
      body: payload,
    });
    showCreate.value = false;
  } catch (failure: unknown) {
    if (getApiErrorStatus(failure) === 401) {
      useAuthUser().value = null;
      await navigateTo({
        path: "/login",
        query: { redirect: route.fullPath, reason: "session-expired" },
      });
      return;
    }
    createError.value =
      getApiErrorStatus(failure) === 500
        ? "Не удалось сохранить изменения. Данные не потеряны. Повторите попытку."
        : getApiErrorMessage(failure);
    return;
  } finally {
    isCreating.value = false;
  }

  await router.replace({ query: {} });
  try {
    await refresh();
  } catch (failure: unknown) {
    createRefreshError.value = `Заявка создана, но список не обновился. ${getApiErrorMessage(failure)}`;
  }
}

function openCreateModal() {
  createError.value = "";
  showCreate.value = true;
}
</script>

<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <p class="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</p>
        <h1>Заявки</h1>
        <p class="muted">Все обращения в одном месте</p>
      </div>
      <button
        v-if="authUser?.role !== 'Agent'"
        class="button button-primary"
        type="button"
        @click="openCreateModal"
      >
        Создать заявку
      </button>
    </div>
    <RequestStats :requests="requests" :counts="data.statusCounts" />
    <p v-if="lookupErrorMessage" class="api-notice" role="status">
      Справочники временно недоступны. {{ lookupErrorMessage }}
    </p>
    <p v-if="createRefreshError" class="api-notice" role="alert">
      {{ createRefreshError }}
      <button class="text-link" type="button" @click="() => refresh()">
        Повторить загрузку списка
      </button>
    </p>
    <section class="section-block">
      <div class="section-heading">
        <h2>Список обращений</h2>
        <span class="result-count">{{ requestCountLabel }}</span>
      </div>
      <RequestFilters
        v-model:search="filters.search"
        v-model:status="filters.status"
        v-model:priority="filters.priority"
        v-model:assignee="filters.assignee"
        v-model:sort="filters.sort"
        :users="lookups.users.value"
      />
      <div class="results-panel" aria-live="polite">
        <div v-if="pending" class="state-message">
          <span class="spinner" aria-hidden="true"></span>
          <strong>Загружаем заявки...</strong>
          <div class="skeleton-list">
            <span v-for="row in 6" :key="row"></span>
          </div>
        </div>
        <div v-else-if="error" class="state-message">
          <span class="state-icon" aria-hidden="true">ⓘ</span>
          <h2>
            Не удалось загрузить заявки
            <span v-if="error.statusCode">· {{ error.statusCode }}</span>
          </h2>
          <p>{{ errorMessage }}</p>
          <button
            class="button button-primary"
            type="button"
            @click="() => refresh()"
          >
            Повторить загрузку
          </button>
        </div>
        <div v-else-if="data.total" class="results-content">
          <RequestTable :requests="requests" />
          <div class="pagination-bar">
            <p class="pagination-summary">
              Показано {{ pageStart }}–{{ pageEnd }} из {{ data.total }}
            </p>
            <nav
              class="pagination-controls"
              aria-label="Навигация по страницам заявок"
            >
              <button
                class="pagination-button pagination-step"
                type="button"
                :disabled="data.page === 1"
                @click="goToPage(data.page - 1)"
              >
                Назад
              </button>
              <button
                v-for="page in pageNumbers"
                :key="page"
                class="pagination-button pagination-number"
                :class="{ 'is-current': data.page === page }"
                type="button"
                :aria-label="`Страница ${page}`"
                :aria-current="data.page === page ? 'page' : undefined"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <button
                class="pagination-button pagination-step"
                type="button"
                :disabled="data.page === totalPages"
                @click="goToPage(data.page + 1)"
              >
                Далее
              </button>
            </nav>
          </div>
        </div>
        <div v-else class="state-message">
          <span class="state-icon" aria-hidden="true">⌕</span>
          <h2>Ничего не найдено</h2>
          <p>Попробуйте изменить запрос или сбросить фильтры.</p>
          <button
            class="button button-outline"
            type="button"
            @click="router.replace({ query: {} })"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>
    </section>
    <CreateRequestModal
      v-if="showCreate"
      :error-message="createError"
      :is-submitting="isCreating"
      :is-client="authUser?.role === 'Client'"
      :client-name="ownCustomer?.name ?? ''"
      :categories="lookups.categories.value"
      @close="showCreate = false"
      @create="createRequest"
    />
  </div>
</template>
