import { z } from "zod";
import { InventoryMovementType } from "../../generated/prisma/enums";
export const createProductMovementSchema = z.object({
  productId: z.uuid(),
  type: z.enum(InventoryMovementType),
  quantity: z.number(),
  referenceId: z.string().optional(),
});

export type createProductMovementInput = z.infer<
  typeof createProductMovementSchema
>;

export const getMovementsQuerySchema = z.object({
  productId: z.uuid().optional(),
  type: z.enum(InventoryMovementType).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetMovementsQuery = z.infer<typeof getMovementsQuerySchema>;
export const getMovementTotalsQuerySchema = z.object({
  productId: z.uuid().optional(),
  type: z.enum(InventoryMovementType).default("SALE"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export type GetMovementTotalsQuery = z.infer<
  typeof getMovementTotalsQuerySchema
>;
