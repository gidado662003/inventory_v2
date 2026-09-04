import { z } from "zod";
import { dateTimeSchema, decimalSchema } from "@/lib/api/shared";
import { saleStatusSchema } from "@/lib/api/customer/schema";

export const dashboardSummarySchema = z.object({
  todaySalesTotal: z.number(),
  todaySalesCount: z.number(),
  outstandingBalance: z.number(),
  lowStockCount: z.number(),
  lowStockThreshold: z.number(),
  recentSales: z.array(
    z.object({
      id: z.string().uuid(),
      totalAmount: decimalSchema,
      status: saleStatusSchema,
      saleDate: dateTimeSchema,
      customer: z
        .object({
          id: z.string().uuid(),
          name: z.string(),
        })
        .nullable()
        .optional(),
    }),
  ),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
