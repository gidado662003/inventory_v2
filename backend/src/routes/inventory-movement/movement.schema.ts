// import { z } from "zod";
// import { InventoryMovementType } from "../../generated/prisma/enums";
// export const createProductMovementSchema = z.object({
//   productId: z.uuid(),
//   type: z.enum(InventoryMovementType),
//   quantity: z.number(),
//   referenceId: z.string().optional(),
// });

// export type createProductMovementInput = z.infer<
//   typeof createProductMovementSchema
// >;

// export const getMovementsQuerySchema = z.object({
//   productId: z.uuid().optional(),
//   type: z.enum(InventoryMovementType).optional(),
//   startDate: z.date().optional(),
//   endDate: z.date().optional(),
//   page: z.coerce.number().int().min(1).default(1),
//   limit: z.coerce.number().int().min(1).max(100).default(20),
// });

// export type GetMovementsQuery = z.infer<typeof getMovementsQuerySchema>;
// export const getMovementTotalsQuerySchema = z.object({
//   productId: z.uuid().optional(),
//   type: z.enum(InventoryMovementType).default("SALE"),
//   startDate: z.date().optional(),
//   endDate: z.date().optional(),
// });

// export type GetMovementTotalsQuery = z.infer<
//   typeof getMovementTotalsQuerySchema
// >;

import { z } from "zod";
import {
  InventoryAdjustmentReason,
  InventoryMovementType,
} from "../../generated/prisma/enums";

export const createProductMovementSchema = z
  .object({
    productId: z.uuid(),
    type: z.enum(InventoryMovementType),
    quantity: z.number().int(),
    reason: z.enum(InventoryAdjustmentReason).optional(),
    referenceId: z.string().trim().max(255).optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .superRefine((movement, ctx) => {
    if (movement.quantity === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Quantity cannot be zero",
      });
    }

    if (movement.type !== "ADJUSTMENT" && movement.quantity < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Quantity must be positive for this movement type",
      });
    }

    if (movement.type === "ADJUSTMENT" && !movement.reason) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "A reason is required for stock adjustments",
      });
    }

    if (movement.type !== "ADJUSTMENT" && movement.reason) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "A reason is only allowed for adjustments",
      });
    }
  });

export type createProductMovementInput = z.infer<
  typeof createProductMovementSchema
>;

export const getMovementsQuerySchema = z.object({
  productId: z.uuid().optional(),
  type: z.enum(InventoryMovementType).optional(),
  search: z.string().trim().max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetMovementsQuery = z.infer<typeof getMovementsQuerySchema>;

export const getMovementTotalsQuerySchema = z.object({
  productId: z.uuid().optional(),
  type: z.enum(InventoryMovementType).default("SALE"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type GetMovementTotalsQuery = z.infer<
  typeof getMovementTotalsQuerySchema
>;
