import { Prisma } from "../../generated/prisma/client";

import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import {
  createProductMovementInput,
  GetMovementTotalsQuery,
} from "./movement.schema";
import { GetMovementsQuery } from "./movement.schema";
import { startOfDay, endOfDay } from "date-fns";

const movementService = {
  createMovement: async (movement: createProductMovementInput) => {
    return await prisma.$transaction(async (tx) => {
      return movementService.createMovementTx(tx, movement);
    });
  },

  createMovementTx: async (
    tx: Prisma.TransactionClient,
    movement: createProductMovementInput,
  ) => {
    const { productId, type, quantity } = movement;

    if (!Number.isInteger(quantity) || quantity === 0) {
      throw new AppError("Quantity must be a non-zero integer", 400);
    }

    if (type !== "ADJUSTMENT" && quantity < 0) {
      throw new AppError(
        "Quantity must be positive for this movement type",
        400,
      );
    }

    if (type === "ADJUSTMENT" && !movement.reason) {
      throw new AppError("A reason is required for stock adjustments", 400);
    }

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let stockDelta: number;

    switch (type) {
      case "INITIAL_STOCK":
      case "RESTOCK":
      case "RETURN":
        stockDelta = quantity;
        break;

      case "SALE":
        stockDelta = -quantity;
        break;

      case "ADJUSTMENT":
        stockDelta = quantity;
        break;

      default:
        throw new AppError("Invalid movement type", 400);
    }

    if (stockDelta < 0) {
      const result = await tx.product.updateMany({
        where: {
          id: productId,
          stockQuantity: { gte: Math.abs(stockDelta) },
        },
        data: {
          stockQuantity: { decrement: Math.abs(stockDelta) },
        },
      });

      if (result.count === 0) {
        throw new AppError("Insufficient stock", 400);
      }
    } else {
      await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: { increment: stockDelta },
        },
      });
    }

    return tx.inventoryMovement.create({
      data: {
        productId,
        type,
        quantity,
        reason: movement.reason,
        referenceId: movement.referenceId,
        note: movement.note,
      },
    });
  },

  getMovements: async (query: GetMovementsQuery) => {
    const startDate = query.startDate
      ? startOfDay(new Date(query.startDate))
      : undefined;

    const endDate = query.endDate
      ? endOfDay(new Date(query.endDate))
      : undefined;

    if (startDate && endDate && startDate > endDate) {
      throw new AppError("startDate cannot be after endDate", 400);
    }

    const where: Prisma.InventoryMovementWhereInput = {
      ...(query.productId && { productId: query.productId }),
      ...(query.type && { type: query.type }),
      ...(query.search && {
        product: {
          OR: [
            {
              name: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              aliases: {
                some: {
                  name: {
                    contains: query.search,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        },
      }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return {
      movements,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  getMovementsByProduct: async (productId: string) => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return prisma.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
  },
  getMovementTotals: async (query: GetMovementTotalsQuery) => {
    const now = new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : startOfDay(now);
    const endDate = query.endDate ? new Date(query.endDate) : endOfDay(now);

    if (startDate > endDate) {
      throw new AppError("startDate cannot be after endDate", 400);
    }

    const where: Prisma.InventoryMovementWhereInput = {
      type: query.type,
      ...(query.productId && { productId: query.productId }),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const totals = await prisma.inventoryMovement.groupBy({
      by: ["productId"],
      where,
      _sum: { quantity: true },
    });

    const products = await prisma.product.findMany({
      where: { id: { in: totals.map((t) => t.productId) } },
      select: { id: true, name: true },
    });

    return totals.map((t) => ({
      productId: t.productId,
      productName: products.find((p) => p.id === t.productId)?.name ?? null,
      totalQuantity: t._sum.quantity ?? 0,
    }));
  },
  getLastRestock: async (productId: string) => {
    const product = await prisma.product.findFirst({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const lastRestock = await prisma.inventoryMovement.findFirst({
      where: {
        productId,
        type: {
          in: ["RESTOCK", "INITIAL_STOCK"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return lastRestock;
  },
};

export default movementService;
