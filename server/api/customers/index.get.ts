import { applyDemoNetworkBehavior } from "../../utils/api-request";
import { customers } from "../../utils/mock-data";

export default defineEventHandler(async (event) => {
  await applyDemoNetworkBehavior(event);
  return customers;
});
