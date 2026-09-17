import z from "zod";
import { PaymentMethod } from "../../generated/prisma/enums";

export const customerSchema = z.object({
  name: z.string().toLowerCase(),
  phone: z.string().optional(),
});

export const updateSchema = z.object({
  name: z.string().toLowerCase().optional(),
  phone: z.string().optional().optional(),
  isActive: z.boolean().optional(),
});

export const customerPaymentSchema = z.object({
  amount: z.number(),
  customerId: z.uuid(),
  method: z.enum(PaymentMethod),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerUpdateInput = z.infer<typeof updateSchema>;
export type CustomerPaymentInput = z.infer<typeof customerPaymentSchema>;
