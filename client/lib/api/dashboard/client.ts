import { clientHttp } from "@/lib/api/http/client";
import { dashboardSummarySchema, type DashboardSummary } from "./schema";

export async function fetchDashboardSummary(
  lowStockThreshold = 10,
): Promise<DashboardSummary> {
  const { data } = await clientHttp.get(
    `/dashboard/summary?lowStockThreshold=${lowStockThreshold}`,
  );
  return dashboardSummarySchema.parse(data);
}
