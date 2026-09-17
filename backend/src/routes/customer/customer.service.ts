import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import {
  CustomerInput,
  CustomerPaymentInput,
  CustomerUpdateInput,
  customerPaymentSchema,
} from "./customer.schema";
import { paymentService } from "../payment/payment.service";
const customerService = {
  createCustomer: async (data: CustomerInput) => {
    const customer = await prisma.customer.create({ data });
    const project = { ...customer, totalOwed: 0 };
    return project;
  },
  getCustomers: async () => {
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          where: {
            status: "CREDIT",
          },
          select: {
            totalAmount: true,
            payments: {
              select: {
                amount: true,
              },
            },
          },
        },
      },
    });

    return customers.map((customer) => {
      const totalOwed = customer.sales.reduce((sum, sale) => {
        const totalPaid = sale.payments.reduce(
          (paymentSum, payment) => paymentSum + payment.amount.toNumber(),
          0,
        );

        const balance = sale.totalAmount.toNumber() - totalPaid;

        return sum + balance;
      }, 0);

      const { sales, ...customerData } = customer;

      return {
        ...customerData,
        totalOwed,
      };
    });
  },
  getCustomerById: async (customerId: string) => {
    const customerData = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sales: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            saleDate: true,
            payments: {
              select: { amount: true },
            },
          },
          orderBy: { saleDate: "desc" },
        },
      },
    });

    if (!customerData) {
      throw new AppError("Customer not found", 404);
    }

    let totalOwed = 0;
    const sales = customerData.sales.map((sale) => {
      const paid = sale.payments.reduce(
        (sum, p) => sum + p.amount.toNumber(),
        0,
      );
      const balance = Number(sale.totalAmount) - paid;
      totalOwed += balance;

      const { payments, ...saleWithoutPayments } = sale;
      return { ...saleWithoutPayments, balance };
    });

    return { ...customerData, sales, totalOwed };
  },
  updateCustomer: async (customerId: string, data: CustomerUpdateInput) => {
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });
    if (!customer) {
      throw new AppError("customer does not exist", 404);
    }
    const update = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data,
    });
    return update;
  },
  customerPayment: async (data: CustomerPaymentInput, recordedBy: string) => {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    if (data.amount <= 0) {
      throw new AppError("Payment amount must be greater than 0", 400);
    }

    return await prisma.$transaction(async (tx) => {
      const customerCreditSales = await tx.sale.findMany({
        where: {
          customerId: data.customerId,
          status: "CREDIT",
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          saleDate: true,
          payments: {
            select: {
              amount: true,
            },
          },
        },
        orderBy: {
          saleDate: "asc",
        },
      });

      if (customerCreditSales.length === 0) {
        throw new AppError("Customer has no outstanding balance", 400);
      }

      const totalOwed = customerCreditSales.reduce((total, sale) => {
        const paid = sale.payments.reduce(
          (sum, payment) => sum + payment.amount.toNumber(),
          0,
        );

        const balance = sale.totalAmount.toNumber() - paid;

        return total + balance;
      }, 0);

      if (data.amount > totalOwed) {
        throw new AppError(
          `Payment amount cannot be greater than customer's outstanding balance of ${totalOwed}`,
          400,
        );
      }

      let remainingAmount = data.amount;

      for (const sale of customerCreditSales) {
        if (remainingAmount <= 0) break;

        const paid = sale.payments.reduce(
          (sum, payment) => sum + payment.amount.toNumber(),
          0,
        );

        const balance = sale.totalAmount.toNumber() - paid;

        if (balance <= 0) continue;

        const paymentAmount = Math.min(remainingAmount, balance);

        await paymentService.createpaymentTx(tx, {
          amount: paymentAmount,
          method: data.method,
          saleId: sale.id,
          recordedById: recordedBy,
        });

        // Balance remaining on this sale after this payment
        const newBalance = balance - paymentAmount;

        if (newBalance === 0) {
          await tx.sale.update({
            where: {
              id: sale.id,
            },
            data: {
              status: "COMPLETED",
            },
          });
        }

        remainingAmount -= paymentAmount;
      }

      return {
        amountPaid: data.amount,
        remainingBalance: totalOwed - data.amount,
      };
    });
  },
};

export default customerService;
