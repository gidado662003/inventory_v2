import "server-only";

import { serverGet } from "@/lib/api/http/server";
import { dashboardSummarySchema } from "./schema";

export async function getDashboardSummary(lowStockThreshold = 10) {
  const data = await serverGet<unknown>(
    `dashboard/summary?lowStockThreshold=${lowStockThreshold}`,
    { next: { tags: ["dashboard"] } },
  );
  return dashboardSummarySchema.parse(data);
}
