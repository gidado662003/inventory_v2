import { z } from "zod";
import {
  dateTimeSchema,
  decimalSchema,
  paginationSchema,
} from "@/lib/api/shared";
import { saleStatusSchema } from "@/lib/api/customer/schema";

export const paymentMethodSchema = z.enum(["CASH", "TRANSFER"]);

export const saleItemSchema = z.object({
  id: z.string().uuid(),
  saleId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number(),
  soldAs: z.string().nullable(),
  unitPrice: decimalSchema,
  subtotal: decimalSchema,
  createdAt: dateTimeSchema.optional(),
  sale: z
    .object({
      customer: z
        .object({
          name: z.string(),
        })
        .nullable(),
    })
    .optional(),
  product: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      price: decimalSchema.optional(),
    })
    .optional(),
});

export const salePaymentSchema = z.object({
  id: z.string().uuid(),
  saleId: z.string().uuid(),
  recordedById: z.string().uuid(),
  amount: decimalSchema,
  method: paymentMethodSchema,
  paymentDate: dateTimeSchema,
  createdAt: dateTimeSchema.optional(),
});

export const saleSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid().nullable().optional(),
  recordedById: z.string().uuid(),
  status: saleStatusSchema,
  totalAmount: decimalSchema,
  saleDate: dateTimeSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  customer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  items: z.array(saleItemSchema).optional(),
  payments: z.array(salePaymentSchema).optional(),
  totalPaid: z.number().optional(),
  balance: z.number().optional(),
});

export const saleItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive("Quantity must be positive"),
  soldAs: z.string().optional(),
});

export const salePaymentInputSchema = z.object({
  amount: z.number().nonnegative("Amount must be positive"),
  method: paymentMethodSchema,
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(saleItemInputSchema).min(1, "At least one item required"),
  payment: z
    .array(salePaymentInputSchema)
    .min(1, "At least one Payment required"),
});

export const editSaleItemSchema = z.object({
  saleItemId: z.string().uuid(),
  newQuantity: z.number().nonnegative(),
});

export const salesListQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: saleStatusSchema.optional(),
  customerId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const salesListResponseSchema = z.object({
  sales: z.array(saleSchema),
  pagination: paginationSchema,
});

export const salesItemListResponseSchema = z.object({
  sales: z.array(saleItemSchema),
  pagination: paginationSchema,
});

export const createSaleResponseSchema = z.object({
  sale: saleSchema,
  payments: z.array(salePaymentSchema),
});

export const paymentMethodBreakdownSchema = z.object({
  amount: z.number(),
  count: z.number(),
});

export const salesSummaryCustomerPaymentSchema = z.object({
  paymentId: z.string(),
  saleId: z.string(),
  amount: z.number(),
  method: z.enum(["CASH", "TRANSFER"]),
});

export const salesSummaryCustomerTransactionSchema = z.object({
  transactionId: z.string(),
  amount: z.number(),
  method: z.enum(["CASH", "TRANSFER"]),
});

export const salesSummaryByCustomerSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  totalAmount: z.number(),
  transactions: z.array(salesSummaryCustomerTransactionSchema),
});

export const salesProductPerDateSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  totalQuantity: z.number(),
});

export const salesSummarySchema = z.object({
  date: z.string(),
  sales: z.object({
    count: z.number(),
    totalAmount: z.number(),
    byPaymentMethod: z.object({
      CASH: paymentMethodBreakdownSchema,
      TRANSFER: paymentMethodBreakdownSchema,
    }),
    outstandingBalance: z.number(),
  }),
  paymentsReceivedToday: z.array(salesSummaryByCustomerSchema),
  totalProduct: z.array(salesProductPerDateSchema),
});

export type SalesSummaryResponse = z.infer<typeof salesSummarySchema>;

export type Sale = z.infer<typeof saleSchema>;
export type SaleItem = z.infer<typeof saleItemSchema>;

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type EditSaleItemInput = z.infer<typeof editSaleItemSchema>;
export type SalesListQuery = z.infer<typeof salesListQuerySchema>;
export type SalesListResponse = z.infer<typeof salesListResponseSchema>;
export type SalesIemListResponse = z.infer<typeof salesItemListResponseSchema>;
