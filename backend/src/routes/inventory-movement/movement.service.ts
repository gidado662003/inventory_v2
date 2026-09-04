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
    const product = await tx.product.findUnique({
      where: {
        id: movement.productId,
      },
      select: {
        stockQuantity: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let newStockQuantity = product.stockQuantity;

    switch (movement.type) {
      case "INITIAL_STOCK":
        newStockQuantity += movement.quantity;
        break;

      case "RESTOCK":
        newStockQuantity += movement.quantity;
        break;

      case "SALE":
        newStockQuantity -= movement.quantity;
        break;

      case "RETURN":
        newStockQuantity += movement.quantity;
        break;

      case "ADJUSTMENT":
        newStockQuantity += movement.quantity;
        break;

      default:
        throw new AppError("Invalid movement type", 400);
    }

    if (newStockQuantity < 0) {
      throw new AppError("Insufficient stock", 400);
    }

    const createdMovement = await tx.inventoryMovement.create({
      data: movement,
    });

    await tx.product.update({
      where: {
        id: movement.productId,
      },
      data: {
        stockQuantity: newStockQuantity,
      },
    });

    return createdMovement;
  },
  getMovements: async (query: GetMovementsQuery) => {
    const now = new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : startOfDay(now);
    const endDate = query.endDate ? new Date(query.endDate) : endOfDay(now);

    if (startDate > endDate) {
      throw new AppError("startDate cannot be after endDate", 400);
    }

    const where: Prisma.InventoryMovementWhereInput = {
      ...(query.productId && { productId: query.productId }),
      ...(query.type && { type: query.type }),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: { product: { select: { id: true, name: true } } },
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
