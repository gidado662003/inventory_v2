"use client";

import { useQuery } from "@tanstack/react-query";
import * as dashboardClient from "./client";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (threshold: number) =>
    [...dashboardKeys.all, "summary", threshold] as const,
};

export function useDashboardSummary(lowStockThreshold = 10) {
  return useQuery({
    queryKey: dashboardKeys.summary(lowStockThreshold),
    queryFn: () => dashboardClient.fetchDashboardSummary(lowStockThreshold),
  });
}
