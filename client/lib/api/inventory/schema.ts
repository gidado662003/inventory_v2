import { z } from "zod";
import { dateTimeSchema, paginationSchema } from "@/lib/api/shared";

export const inventoryMovementTypeSchema = z.enum([
  "INITIAL_STOCK",
  "RESTOCK",
  "SALE",
  "RETURN",
  "ADJUSTMENT",
]);

export const inventoryMovementSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  type: inventoryMovementTypeSchema,
  quantity: z.number(),
  reason: z
    .enum(["DAMAGED", "EXPIRED", "LOST", "FOUND", "CORRECTION", "OTHER"])
    .nullable()
    .optional(),
  referenceId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: dateTimeSchema,
  product: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .optional(),
});

export const createMovementSchema = z.object({
  productId: z.string().uuid("Product is required"),
  type: inventoryMovementTypeSchema,
  quantity: z.number(),
});

export const movementsListQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  type: inventoryMovementTypeSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const movementsListResponseSchema = z.object({
  movements: z.array(inventoryMovementSchema),
  pagination: paginationSchema,
});

export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;
export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type MovementsListQuery = z.infer<typeof movementsListQuerySchema>;
export type MovementsListResponse = z.infer<typeof movementsListResponseSchema>;
