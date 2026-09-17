import { AppError } from "../../utils/AppError";
import { startOfDay, endOfDay } from "date-fns";
import { salesSchemaInput, GetSalesSummaryQuery } from "./sale.schema";
import { prisma } from "../../lib/prisma";
import { GetSalesQuery } from "./sale.schema";
import movementService from "../inventory-movement/movement.service";
import { PaymentMethod } from "../../generated/prisma/enums";

import { paymentService } from "../payment/payment.service";

export const salesService = {
  createSales: async (data: salesSchemaInput, userId: string) => {
    const productIds = data.items.map((item) => item.productId);

    return await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          name: true,
          price: true,
          stockQuantity: true,
        },
      });

      for (const item of data.items) {
        const product = products.find(
          (product) => product.id === item.productId,
        );

        if (!product) {
          throw new AppError(`Product ${item.productId} not found`, 400);
        }

        if (product.stockQuantity < item.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}`, 400);
        }
      }

      const totalAmount = data.items.reduce((total, item) => {
        const product = products.find(
          (product) => product.id === item.productId,
        )!;

        return total + Number(product.price) * item.quantity;
      }, 0);

      const totalPaid = data.payment.reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid > totalAmount) {
        throw new AppError(`Payment amount cannot exceed ${totalAmount}`, 400);
      }
      const credit = totalAmount > totalPaid;
      if (credit && !data.customerId) {
        throw new AppError("Customer required for a Credit Sale", 400);
      }

      const sale = await tx.sale.create({
        data: {
          customerId: data.customerId,
          recordedById: userId,
          totalAmount,
          status: credit ? "CREDIT" : "COMPLETED",
          items: {
            create: data.items.map((item) => {
              const product = products.find(
                (product) => product.id === item.productId,
              )!;

              return {
                productId: item.productId,
                quantity: item.quantity,
                soldAs: item.soldAs,
                unitPrice: product.price,
                subtotal: Number(product.price) * item.quantity,
              };
            }),
          },
        },

        include: {
          items: true,
        },
      });
      const payments = [];
      for (const p of data.payment) {
        const payment = await paymentService.createpaymentTx(tx, {
          saleId: sale.id,
          amount: p.amount,
          method: p.method,
          recordedById: userId,
        });
        payments.push(payment);
      }

      for (const item of data.items) {
        await movementService.createMovementTx(tx, {
          productId: item.productId,
          type: "SALE",
          quantity: item.quantity,
        });
      }

      return { sale, payments };
    });
  },
  getSales: async (query: GetSalesQuery) => {
    const startDate = query.startDate
      ? startOfDay(new Date(query.startDate))
      : startOfDay(new Date());

    const endDate = query.endDate
      ? endOfDay(new Date(query.endDate))
      : endOfDay(new Date());

    if (startDate > endDate) {
      throw new AppError("startDate cannot be after endDate", 400);
    }

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(query.status && { status: query.status }),
      ...(query.customerId && { customerId: query.customerId }),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: true,
          customer: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return {
      sales,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },
  getSalesItems: async (query: GetSalesQuery) => {
    const startDate = query.startDate
      ? startOfDay(new Date(query.startDate))
      : startOfDay(new Date());

    const endDate = query.endDate
      ? endOfDay(new Date(query.endDate))
      : endOfDay(new Date());

    if (startDate > endDate) {
      throw new AppError("startDate cannot be after endDate", 400);
    }

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(query.status && { status: query.status }),
      ...(query.customerId && { customerId: query.customerId }),
    };

    const [sales, total] = await Promise.all([
      prisma.saleItem.findMany({
        where,
        include: {
          sale: {
            select: {
              customer: { select: { name: true } },
            },
          },
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return {
      sales,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },
  getSaleById: async (id: string) => {
    const sale = await prisma.sale.findFirst({
      where: { id },
      include: {
        items: { include: { product: true } },
        customer: true,
        payments: {
          orderBy: { paymentDate: "asc" },
          where: { amount: { gt: 0 } },
        },
      },
    });
    if (!sale) {
      throw new AppError("Sale not found", 404);
    }
    const totalPaid = sale.payments.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0,
    );
    const balance = Number(sale.totalAmount) - totalPaid;
    return { ...sale, totalPaid, balance };
  },
  editSaleItems: async (
    saleId: string,
    itemUpdates: { saleItemId: string; newQuantity: number }[],
    editedById: string,
  ) => {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true, payments: true },
    });

    if (!sale) {
      throw new AppError("Sale not found", 404);
    }
    if (sale.status === "VOUIDED") {
      throw new AppError("Cannot edit a voided sale", 400);
    }

    const changes: {
      productId: string;
      previousQuantity: number;
      newQuantity: number;
    }[] = [];
    let totalAmountDelta = 0;

    for (const update of itemUpdates) {
      const item = sale.items.find((i) => i.id === update.saleItemId);
      if (!item) {
        throw new AppError(
          `Sale item ${update.saleItemId} not found on this sale`,
          404,
        );
      }
      if (update.newQuantity >= item.quantity) {
        throw new AppError(
          `newQuantity must be less than current quantity (${item.quantity}) — editing only supports reducing quantity`,
          400,
        );
      }
      if (update.newQuantity < 0) {
        throw new AppError("newQuantity cannot be negative", 400);
      }

      const reducedBy = item.quantity - update.newQuantity;
      totalAmountDelta += Number(item.unitPrice) * reducedBy;

      changes.push({
        productId: item.productId,
        previousQuantity: item.quantity,
        newQuantity: update.newQuantity,
      });
    }

    const newTotalAmount = Number(sale.totalAmount) - totalAmountDelta;
    const totalPaid = sale.payments.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0,
    );

    return await prisma.$transaction(async (tx) => {
      for (const update of itemUpdates) {
        const item = sale.items.find((i) => i.id === update.saleItemId)!;
        const reducedBy = item.quantity - update.newQuantity;

        await movementService.createMovementTx(tx, {
          productId: item.productId,
          type: "RETURN",
          quantity: reducedBy,
          referenceId: sale.id,
        });

        await tx.saleItem.update({
          where: { id: item.id },
          data: {
            quantity: update.newQuantity,
            subtotal: Number(item.unitPrice) * update.newQuantity,
          },
        });
      }

      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          totalAmount: newTotalAmount,
          status: totalPaid >= newTotalAmount ? "COMPLETED" : "CREDIT",
        },
      });

      await tx.saleEditLog.create({
        data: {
          saleId,
          editedById,
          previousTotalAmount: sale.totalAmount,
          newTotalAmount,
          changes,
        },
      });

      return updatedSale;
    });
  },

  getSalesSummary: async (query: GetSalesSummaryQuery) => {
    const targetDate = query.date ? new Date(query.date) : new Date();
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);
    const totalProduct = await movementService.getMovementTotals({
      type: "SALE",
      startDate: start,
      endDate: end,
    });
    const todaysSales = await prisma.sale.findMany({
      where: {
        saleDate: { gte: start, lte: end },
      },
      select: { id: true, totalAmount: true },
    });

    const salesCount = todaysSales.length;
    const salesTotalAmount = todaysSales.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0,
    );
    const todaysSaleIds = todaysSales.map((s) => s.id);

    const paymentsForTodaysSales = todaysSaleIds.length
      ? await prisma.payment.groupBy({
          by: ["method"],
          where: { saleId: { in: todaysSaleIds } },
          _sum: { amount: true },
          _count: { _all: true },
        })
      : [];

    const salesByMethod = buildMethodBreakdown(paymentsForTodaysSales);
    const paidAgainstTodaysSales = paymentsForTodaysSales.reduce(
      (sum, p) => sum + Number(p._sum.amount ?? 0),
      0,
    );
    const outstandingBalance = salesTotalAmount - paidAgainstTodaysSales;

    const customerPaymentsToday = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: start, lte: end },
        sale: { customerId: { not: null } },
      },
      select: {
        id: true,
        amount: true,
        method: true,
        saleId: true,
        sale: {
          select: {
            customer: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { paymentDate: "asc" },
    });

    const byCustomerMap = new Map<
      string,
      {
        customerId: string;
        customerName: string;
        totalAmount: number;
        payments: {
          paymentId: string;
          saleId: string;
          amount: number;
          method: PaymentMethod;
        }[];
      }
    >();

    for (const payment of customerPaymentsToday) {
      const customer = payment.sale.customer!;
      const entry = byCustomerMap.get(customer.id) ?? {
        customerId: customer.id,
        customerName: customer.name,
        totalAmount: 0,
        payments: [],
      };

      entry.totalAmount += Number(payment.amount);
      entry.payments.push({
        paymentId: payment.id,
        saleId: payment.saleId,
        amount: Number(payment.amount),
        method: payment.method,
      });

      byCustomerMap.set(customer.id, entry);
    }

    const paymentsReceivedToday = Array.from(byCustomerMap.values());

    return {
      date: start.toISOString().slice(0, 10),
      sales: {
        count: salesCount,
        totalAmount: salesTotalAmount,
        byPaymentMethod: salesByMethod,
        outstandingBalance,
      },
      paymentsReceivedToday,
      totalProduct,
    };
  },
};

function buildMethodBreakdown(
  grouped: {
    method: PaymentMethod;
    _sum: { amount: unknown };
    _count: { _all: number };
  }[],
) {
  const result: Record<PaymentMethod, { amount: number; count: number }> = {
    CASH: { amount: 0, count: 0 },
    TRANSFER: { amount: 0, count: 0 },
  };

  for (const g of grouped) {
    result[g.method] = {
      amount: Number(g._sum.amount ?? 0),
      count: g._count._all,
    };
  }

  return result;
}
