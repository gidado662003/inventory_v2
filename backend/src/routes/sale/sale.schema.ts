import z from "zod";
import { paymentWithoutSaleSchema } from "../payment/payment.schema";
import { SaleStatus } from "../../generated/prisma/enums";
export const salesItemSchma = z.object({
  productId: z.uuid(),
  quantity: z.number(),
  soldAs: z.string().optional(),
});

export const salesSchema = z.object({
  customerId: z.uuid().optional(),
  items: z.array(salesItemSchma),
  payment: z.array(paymentWithoutSaleSchema).min(1),
});

export const salesItemEdit = z.object({
  saleItemId: z.uuid(),
  newQuantity: z.number().nonnegative(),
});

export const salesId = z.uuid();

export type salesSchemaInput = z.infer<typeof salesSchema>;

export const getSalesQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(SaleStatus).optional(),
  customerId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetSalesQuery = z.infer<typeof getSalesQuerySchema>;

export const getSalesSummaryQuerySchema = z.object({
  date: z.date().optional(),
});

export type GetSalesSummaryQuery = z.infer<typeof getSalesSummaryQuerySchema>;
