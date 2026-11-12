import { createHash, randomBytes } from "node:crypto";
import {
  createError,
  deleteCookie,
  getCookie,
  setCookie,
  type H3Event,
} from "h3";
import type { AuthUser, UserRole } from "#shared/types/request";
import { query } from "./database";

const cookieName = "workflow_session";
const sessionDurationMs = 1000 * 60 * 60 * 12;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toAuthUser(row: {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  customer_id: string | number | null;
}): AuthUser {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    customerId: row.customer_id === null ? null : Number(row.customer_id),
  };
}

export async function getOptionalUser(event: H3Event) {
  const token = getCookie(event, cookieName);
  if (!token) return null;

  const result = await query<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    customer_id: string | null;
  }>(
    `SELECT u.id, u.name, u.email, u.role, u.customer_id
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND u.is_active = TRUE`,
    [hashToken(token)],
  );
  if (!result.rows[0]) return null;
  return toAuthUser(result.rows[0]);
}

export async function hasExpiredSession(event: H3Event) {
  const token = getCookie(event, cookieName);
  if (!token) return false;
  const result = await query<{ expired: boolean }>(
    `SELECT expires_at <= now() AS expired
     FROM auth_sessions WHERE token_hash = $1`,
    [hashToken(token)],
  );
  return result.rows[0]?.expired ?? false;
}

export async function requireUser(event: H3Event) {
  const user = event.context.user ?? (await getOptionalUser(event));
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Требуется вход в систему.",
    });
  }
  event.context.user = user;
  return user;
}

export function requireRoles(user: AuthUser, roles: readonly UserRole[]) {
  if (!roles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Недостаточно прав для этой операции.",
    });
  }
}

export async function startSession(event: H3Event, userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  await query(
    `INSERT INTO auth_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [hashToken(token), userId, expiresAt],
  );
  setCookie(event, cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(event: H3Event) {
  const token = getCookie(event, cookieName);
  if (token) {
    await query("DELETE FROM auth_sessions WHERE token_hash = $1", [
      hashToken(token),
    ]);
  }
  deleteCookie(event, cookieName, { path: "/" });
}
