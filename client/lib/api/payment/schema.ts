import { z } from "zod";
import {
  dateTimeSchema,
  decimalSchema,
  paginationSchema,
} from "@/lib/api/shared";
import { paymentMethodSchema } from "@/lib/api/sales/schema";

export const paymentSchema = z.object({
  id: z.string().uuid(),
  saleId: z.string().uuid(),
  recordedById: z.string().uuid(),
  amount: decimalSchema,
  method: paymentMethodSchema,
  paymentDate: dateTimeSchema,
  createdAt: dateTimeSchema.optional(),
  balanceAfter: z.number().optional(),
  remainingAfterPayment: z.number().optional(),
  sale: z
    .object({
      id: z.string().uuid(),
      customer: z
        .object({
          id: z.string().uuid(),
          name: z.string(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
});

export const createPaymentSchema = z.object({
  saleId: z.string().uuid("Sale is required"),
  amount: z.number().positive("Amount must be positive"),
  method: paymentMethodSchema,
});

export const createCustomerPaymentSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  amount: z.number().positive("Amount must be positive"),
  method: paymentMethodSchema,
});

export const paymentsListQuerySchema = z.object({
  saleId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const paymentsListResponseSchema = z.object({
  payments: z.array(paymentSchema),
  pagination: paginationSchema,
});

export type Payment = z.infer<typeof paymentSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PaymentsListQuery = z.infer<typeof paymentsListQuerySchema>;
export type PaymentsListResponse = z.infer<typeof paymentsListResponseSchema>;
