import { createError, getRequestURL } from "h3";
import { getOptionalUser } from "../utils/auth";

const publicAuthPaths = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/session",
]);

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname;
  if (!pathname.startsWith("/api/") || publicAuthPaths.has(pathname)) return;

  const user = await getOptionalUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Требуется вход в систему.",
    });
  }
  event.context.user = user;
});
