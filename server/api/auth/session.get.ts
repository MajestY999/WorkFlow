import { setResponseHeader } from "h3";
import { getOptionalUser, hasExpiredSession } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const user = await getOptionalUser(event);
  return { user, expired: user ? false : await hasExpiredSession(event) };
});
