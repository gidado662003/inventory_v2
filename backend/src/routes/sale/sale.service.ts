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

    // ============================================================
    // 1. TODAY'S SALES
    // ============================================================

    const todaysSales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        totalAmount: true,
        status: true,
      },
    });

    const todaysSaleIds = todaysSales.map((sale) => sale.id);
    const todaysSaleIdSet = new Set(todaysSaleIds);

    const salesTotalAmount = todaysSales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );

    // ============================================================
    // 2. MONEY RECEIVED TODAY
    //
    // There are two sources:
    //
    // A. Direct payments
    //    - Payment made directly against a sale
    //
    // B. Payment transactions
    //    - Money received from a customer for credit
    //    - Can be allocated to today's sales OR older balances
    // ============================================================

    const [directPaymentsByMethod, creditTransactionsByMethod] =
      await Promise.all([
        // Direct payments against sales
        prisma.payment.groupBy({
          by: ["method"],
          where: {
            paymentDate: {
              gte: start,
              lte: end,
            },
            transactionId: null,
          },
          _sum: {
            amount: true,
          },
          _count: {
            _all: true,
          },
        }),

        // Customer credit-payment transactions
        prisma.paymentTransaction.groupBy({
          by: ["method"],
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          _sum: {
            amount: true,
          },
          _count: {
            _all: true,
          },
        }),
      ]);

    type Bucket = {
      amount: number;
      count: number;
    };

    // ============================================================
    // ALL MONEY RECEIVED TODAY
    // ============================================================

    const cashReceivedByMethod: Record<"CASH" | "TRANSFER", Bucket> = {
      CASH: {
        amount: 0,
        count: 0,
      },
      TRANSFER: {
        amount: 0,
        count: 0,
      },
    };

    const cashReceivedTotal: Bucket = {
      amount: 0,
      count: 0,
    };

    // Direct sale payments
    for (const row of directPaymentsByMethod) {
      const amount = Number(row._sum.amount ?? 0);

      cashReceivedByMethod[row.method].amount += amount;
      cashReceivedByMethod[row.method].count += row._count._all;

      cashReceivedTotal.amount += amount;
      cashReceivedTotal.count += row._count._all;
    }

    // Credit payments
    for (const row of creditTransactionsByMethod) {
      const amount = Number(row._sum.amount ?? 0);

      cashReceivedByMethod[row.method].amount += amount;
      cashReceivedByMethod[row.method].count += row._count._all;

      cashReceivedTotal.amount += amount;
      cashReceivedTotal.count += row._count._all;
    }

    // ============================================================
    // 3. PAYMENTS THAT BROUGHT MONEY IN TODAY
    //
    // We need the individual Payment rows so we can determine
    // whether each payment belongs to:
    //
    // - today's sale
    // - an older credit balance
    // ============================================================

    const [directToday, viaTransactionToday] = await Promise.all([
      // Direct payment against a sale today
      prisma.payment.findMany({
        where: {
          paymentDate: {
            gte: start,
            lte: end,
          },
          transactionId: null,
        },
        select: {
          saleId: true,
          amount: true,
          method: true,
        },
      }),

      // Payment allocated through a credit transaction created today
      prisma.payment.findMany({
        where: {
          transaction: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
        select: {
          saleId: true,
          amount: true,
          method: true,
        },
      }),
    ]);

    const todaysCashPayments = [...directToday, ...viaTransactionToday];

    // ============================================================
    // 4. MONEY RECEIVED FROM TODAY'S SALES VS OLDER BALANCES
    // ============================================================

    const fromTodaysSales: Bucket = {
      amount: 0,
      count: 0,
    };

    const fromOlderBalances: Bucket = {
      amount: 0,
      count: 0,
    };

    const splitByMethod = {
      CASH: {
        fromTodaysSales: 0,
        fromOlderBalances: 0,
      },

      TRANSFER: {
        fromTodaysSales: 0,
        fromOlderBalances: 0,
      },
    };

    for (const payment of todaysCashPayments) {
      const amount = Number(payment.amount);

      // Payment belongs to one of today's sales
      if (todaysSaleIdSet.has(payment.saleId)) {
        fromTodaysSales.amount += amount;
        fromTodaysSales.count += 1;

        splitByMethod[payment.method].fromTodaysSales += amount;
      }

      // Payment belongs to an older sale / outstanding balance
      else {
        fromOlderBalances.amount += amount;
        fromOlderBalances.count += 1;

        splitByMethod[payment.method].fromOlderBalances += amount;
      }
    }

    // ============================================================
    // 5. PAYMENT METHOD FOR TODAY'S SALES ONLY
    //
    // This is different from cashReceivedByMethod.
    //
    // cashReceivedByMethod:
    //   ALL money received today
    //
    // todaysSalesPaymentByMethod:
    //   Money received today that was applied to today's sales
    // ============================================================

    const todaysSalesPaymentByMethod: Record<"CASH" | "TRANSFER", Bucket> = {
      CASH: {
        amount: 0,
        count: 0,
      },

      TRANSFER: {
        amount: 0,
        count: 0,
      },
    };

    for (const payment of todaysCashPayments) {
      if (todaysSaleIdSet.has(payment.saleId)) {
        const amount = Number(payment.amount);

        todaysSalesPaymentByMethod[payment.method].amount += amount;
        todaysSalesPaymentByMethod[payment.method].count += 1;
      }
    }

    // ============================================================
    // 6. CREDIT PAYMENT METHOD
    //
    // Money received today for older balances.
    // ============================================================

    const olderBalancePaymentByMethod: Record<"CASH" | "TRANSFER", Bucket> = {
      CASH: {
        amount: 0,
        count: 0,
      },

      TRANSFER: {
        amount: 0,
        count: 0,
      },
    };

    for (const payment of todaysCashPayments) {
      if (!todaysSaleIdSet.has(payment.saleId)) {
        const amount = Number(payment.amount);

        olderBalancePaymentByMethod[payment.method].amount += amount;
        olderBalancePaymentByMethod[payment.method].count += 1;
      }
    }

    // ============================================================
    // 7. TOTAL PAID AGAINST TODAY'S SALES
    //
    // This looks at ALL payments against today's sales,
    // regardless of when the payment was made.
    // ============================================================

    const paidAgg = todaysSaleIds.length
      ? await prisma.payment.aggregate({
          where: {
            saleId: {
              in: todaysSaleIds,
            },
          },
          _sum: {
            amount: true,
          },
        })
      : null;

    const paidAgainstTodaysSales = Number(paidAgg?._sum.amount ?? 0);

    // ============================================================
    // 8. CUSTOMER CREDIT PAYMENTS TODAY
    //
    // Used to show:
    //
    // Customer
    // Total paid today
    // Applied to today's sales
    // Applied to older balances
    // Individual transactions
    // ============================================================

    const customerPaymentsToday = await prisma.paymentTransaction.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },

      select: {
        id: true,
        amount: true,
        method: true,

        customer: {
          select: {
            id: true,
            name: true,
          },
        },

        payments: {
          select: {
            saleId: true,
            amount: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });

    // ============================================================
    // 9. GROUP CREDIT PAYMENTS BY CUSTOMER
    // ============================================================

    const byCustomerMap = new Map<
      string,
      {
        customerId: string;
        customerName: string;

        totalAmount: number;

        appliedToTodaysSales: number;
        appliedToOlderBalances: number;

        transactions: {
          transactionId: string;
          amount: number;
          method: "CASH" | "TRANSFER";

          appliedToTodaysSales: number;
          appliedToOlderBalances: number;
        }[];
      }
    >();

    for (const transaction of customerPaymentsToday) {
      let appliedToTodaysSales = 0;
      let appliedToOlderBalances = 0;

      for (const payment of transaction.payments) {
        const amount = Number(payment.amount);

        if (todaysSaleIdSet.has(payment.saleId)) {
          appliedToTodaysSales += amount;
        } else {
          appliedToOlderBalances += amount;
        }
      }

      const existingCustomer = byCustomerMap.get(transaction.customer.id);

      const customerEntry = existingCustomer ?? {
        customerId: transaction.customer.id,
        customerName: transaction.customer.name,

        totalAmount: 0,

        appliedToTodaysSales: 0,
        appliedToOlderBalances: 0,

        transactions: [],
      };

      customerEntry.totalAmount += Number(transaction.amount);

      customerEntry.appliedToTodaysSales += appliedToTodaysSales;

      customerEntry.appliedToOlderBalances += appliedToOlderBalances;

      customerEntry.transactions.push({
        transactionId: transaction.id,
        amount: Number(transaction.amount),
        method: transaction.method,

        appliedToTodaysSales,
        appliedToOlderBalances,
      });

      byCustomerMap.set(transaction.customer.id, customerEntry);
    }

    // ============================================================
    // 10. TOTAL PRODUCT MOVEMENT
    // ============================================================

    const totalProduct = await movementService.getMovementTotals({
      type: "SALE",
      startDate: start,
      endDate: end,
    });

    // ============================================================
    // 11. FINAL RESPONSE
    // ============================================================

    return {
      date: start.toISOString().slice(0, 10),

      // ==========================================================
      // MONEY RECEIVED TODAY
      // ==========================================================
      cashReceived: {
        // EVERYTHING received today
        total: cashReceivedTotal,

        // EVERYTHING received today grouped by payment method
        byMethod: cashReceivedByMethod,

        // Money received today that belongs to today's sales
        fromTodaysSales,

        // Money received today that was used to settle
        // older outstanding balances
        fromOlderBalances,

        // Same split, but also separated by payment method
        splitByMethod,

        // Explicit method buckets
        todaysSalesPaymentByMethod,

        olderBalancePaymentByMethod,
      },

      // ==========================================================
      // TODAY'S SALES
      // ==========================================================
      sales: {
        count: todaysSales.length,

        totalAmount: salesTotalAmount,

        // ALL payments ever made against today's sales
        paidAgainstTodaysSales,

        // What is still outstanding
        outstandingBalance: Math.max(
          0,
          salesTotalAmount - paidAgainstTodaysSales,
        ),

        // Payment method specifically for today's sales
        paymentByMethod: todaysSalesPaymentByMethod,
      },

      // ==========================================================
      // CUSTOMER CREDIT PAYMENTS RECEIVED TODAY
      // ==========================================================
      paymentsReceivedToday: Array.from(byCustomerMap.values()),

      // ==========================================================
      // PRODUCT MOVEMENT
      // ==========================================================
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
