import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import { CustomerInput, CustomerUpdateInput } from "./customer.schema";
const customerService = {
  createCustomer: async (data: CustomerInput) => {
    const customer = await prisma.customer.create({ data });
    return customer;
  },
  getCustomers: async () => {
    const customers = await prisma.customer.findMany();
    return customers;
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
};

export default customerService;
