import type { AuthUser } from "#shared/types/request";

declare module "h3" {
  interface H3EventContext {
    user?: AuthUser;
  }
}

export {};
