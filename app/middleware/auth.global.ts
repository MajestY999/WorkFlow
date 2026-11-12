import type { AuthSessionResponse } from "#shared/types/request";

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === "/") return;

  const authUser = useAuthUser();
  const wasAuthenticated = Boolean(authUser.value);
  const headers = import.meta.server
    ? useRequestHeaders(["cookie"])
    : undefined;
  const session = await $fetch<AuthSessionResponse>("/api/auth/session", {
    headers,
  });
  authUser.value = session.user;

  if (to.path === "/login" || to.path === "/register") {
    if (session.user) return navigateTo("/dashboard");
    return;
  }
  if (!session.user) {
    return navigateTo({
      path: "/login",
      query: {
        redirect: to.fullPath,
        ...(session.expired || wasAuthenticated
          ? { reason: "session-expired" }
          : {}),
      },
    });
  }
  if (to.path.startsWith("/admin") && session.user.role !== "Admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Эта страница доступна только администратору.",
    });
  }
});
