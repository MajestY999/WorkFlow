import { applyDemoNetworkBehavior } from "../../utils/api-request";
import { users } from "../../utils/mock-data";

export default defineEventHandler(async (event) => {
  await applyDemoNetworkBehavior(event);
  return users;
});
