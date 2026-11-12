import { applyDemoNetworkBehavior } from "../../utils/api-request";
import { categories } from "../../utils/mock-data";

export default defineEventHandler(async (event) => {
  await applyDemoNetworkBehavior(event);
  return categories;
});
