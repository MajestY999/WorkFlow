export async function logoutUser() {
  await $fetch("/api/auth/logout", { method: "POST" });
  useAuthUser().value = null;
  await navigateTo("/");
}
