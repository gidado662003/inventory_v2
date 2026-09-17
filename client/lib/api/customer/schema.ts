import { z } from "zod";
import { dateTimeSchema, decimalSchema } from "@/lib/api/shared";

export const saleStatusSchema = z.enum([
  "COMPLETED",
  "CREDIT",
  "VOUIDED",
  "TEST",
]);

export const customerSchema = z.object({
  id: z.string().uuid(),
  totalOwed: z.number(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const customerSaleSummarySchema = z.object({
  id: z.string().uuid(),
  totalAmount: decimalSchema,
  status: saleStatusSchema,
  saleDate: dateTimeSchema,
  balance: z.number(),
});

export const customerDetailSchema = customerSchema.extend({
  sales: z.array(customerSaleSummarySchema),
  totalOwed: z.number(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createCustomerPaymentInputSchema = z.object({
  customerId: z.string(),
  amount: z.number().positive(),
  method: z.enum(["CASH", "TRANSFER"]),
});
export const customerPaymentSchema = z.object({
  amountPaid: z.number(),
  remainingBalance: z.number(),
});

export type Customer = z.infer<typeof customerSchema>;
export type CustomerDetail = z.infer<typeof customerDetailSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type SaleStatus = z.infer<typeof saleStatusSchema>;
export type CreateCustomerPaymentInput = z.infer<
  typeof createCustomerPaymentInputSchema
>;

export type CustomerPayment = z.infer<typeof customerPaymentSchema>;
