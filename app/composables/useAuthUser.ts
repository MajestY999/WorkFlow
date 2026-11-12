import type { AuthUser } from "#shared/types/request";

export function useAuthUser() {
  return useState<AuthUser | null>("workflow-auth-user", () => null);
}
