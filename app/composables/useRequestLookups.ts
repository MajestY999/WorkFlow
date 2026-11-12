import type { ApiCategory, ApiCustomer, ApiUser } from "~/types/request";

export async function useRequestLookups() {
  const [usersResult, customersResult, categoriesResult] = await Promise.all([
    useFetch<ApiUser[]>("/api/users", {
      key: "request-lookups-users",
      default: () => [],
    }),
    useFetch<ApiCustomer[]>("/api/customers", {
      key: "request-lookups-customers",
      default: () => [],
    }),
    useFetch<ApiCategory[]>("/api/categories", {
      key: "request-lookups-categories",
      default: () => [],
    }),
  ]);

  const users = computed(() => usersResult.data.value ?? []);
  const customers = computed(() => customersResult.data.value ?? []);
  const categories = computed(() => categoriesResult.data.value ?? []);
  const error = computed(
    () =>
      usersResult.error.value ??
      customersResult.error.value ??
      categoriesResult.error.value,
  );

  return { users, customers, categories, error };
}
