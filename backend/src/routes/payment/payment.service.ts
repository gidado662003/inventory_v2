import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { PaymentInput, GetPaymentsQuery } from "./payment.schema";
import { Prisma } from "../../generated/prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export const paymentService = {
  createpayment: async (data: PaymentInput) => {
    const saleValid = await prisma.sale.findUnique({
      where: { id: data.saleId },

      select: {
        status: true,
        payments: true,
        totalAmount: true,
      },
    });
    if (!saleValid) {
      throw new AppError("Invalid sale", 400);
    }

    const totalPaid = saleValid?.payments.reduce(
      (total, item) => total + item.amount.toNumber(),
      0,
    );
    const amountLeft = Number(saleValid.totalAmount) - totalPaid;

    if (amountLeft <= 0) {
      throw new AppError("Sales already paid completely", 400);
    }

    if (data.amount > amountLeft) {
      throw new AppError("Amount paid cant exceed amount owed", 400);
    }
    const remainingAfterPayment = amountLeft - data.amount;
    const payment = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data,
      });

      if (remainingAfterPayment === 0) {
        await tx.sale.update({
          where: { id: data.saleId },
          data: {
            status: "COMPLETED",
          },
        });
      }

      return payment;
    });
    return { ...payment, remainingAfterPayment };
  },
  createpaymentTx: async (tx: Prisma.TransactionClient, data: PaymentInput) => {
    const payment = tx.payment.create({ data });
    return payment;
  },
  getPaymentsBySale: async (saleId: string) => {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: { id: true, totalAmount: true },
    });

    if (!sale) {
      throw new AppError("Invalid sale", 400);
    }

    const payments = await prisma.payment.findMany({
      where: { saleId },
      orderBy: { paymentDate: "asc" },
    });

    let runningTotal = 0;
    const withBalance = payments.map((payment) => {
      runningTotal += payment.amount.toNumber();
      return {
        ...payment,
        balanceAfter: Number(sale.totalAmount) - runningTotal,
      };
    });

    return withBalance;
  },
  getPaymentsByCustomer: async (customerId: string) => {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!customer) {
      throw new AppError("Invalid customer", 400);
    }
    const payments = await prisma.payment.findMany({
      where: { sale: { customerId } },
      orderBy: { createdAt: "asc" },
    });
    return payments;
  },
  getPayments: async (query: GetPaymentsQuery) => {
    const now = new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : startOfDay(now);
    const endDate = query.endDate ? new Date(query.endDate) : endOfDay(now);

    if (startDate > endDate) {
      throw new AppError("startDate cannot be after endDate", 400);
    }

    const where: Prisma.PaymentWhereInput = {
      paymentDate: { gte: startDate, lte: endDate },
      amount: { gt: 0 },
      sale: { customerId: { not: null } },
      ...(query.saleId && { saleId: query.saleId }),
      ...(query.customerId && { sale: { customerId: query.customerId } }),
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        // where,
        include: {
          sale: {
            select: {
              id: true,
              customer: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { paymentDate: "desc" },
        // skip: (query.page - 1) * query.limit,
        // take: query.limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },
};
