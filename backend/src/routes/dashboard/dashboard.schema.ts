import { z } from "zod";

export const dashboardSummaryQuerySchema = z.object({
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
});

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>;
