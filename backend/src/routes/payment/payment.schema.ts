import z from "zod";
import { PaymentMethod } from "../../generated/prisma/enums";

const paymentBaseSchema = z.object({
  amount: z.number().nonnegative(),
  method: z.enum(PaymentMethod),
});

export const paymentSchema = paymentBaseSchema.extend({
  saleId: z.uuid(),
  recordedById: z.uuid(),
});

export const paymentWithSaleSchema = paymentBaseSchema.extend({
  saleId: z.uuid(),
});

export const paymentWithoutSaleSchema = paymentBaseSchema;

export const getPaymentsQuerySchema = z.object({
  saleId: z.uuid().optional(),
  customerId: z.uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type GetPaymentsQuery = z.infer<typeof getPaymentsQuerySchema>;
