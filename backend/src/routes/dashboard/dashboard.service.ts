import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "../../lib/prisma";
import { DashboardSummaryQuery } from "./dashboard.schema";

export const dashboardService = {
  getSummary: async (query: DashboardSummaryQuery) => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [
      todaySales,
      creditSales,
      lowStockCount,
      recentSales,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          saleDate: { gte: todayStart, lte: todayEnd },
          status: { not: "VOUIDED" },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.sale.findMany({
        where: { status: "CREDIT" },
        include: { payments: { select: { amount: true } } },
      }),
      prisma.product.count({
        where: {
          isActive: true,
          stockQuantity: { lte: query.lowStockThreshold },
        },
      }),
      prisma.sale.findMany({
        take: 5,
        orderBy: { saleDate: "desc" },
        include: {
          customer: { select: { id: true, name: true } },
        },
      }),
    ]);

    const outstandingBalance = creditSales.reduce((total, sale) => {
      const paid = sale.payments.reduce(
        (sum, p) => sum + p.amount.toNumber(),
        0,
      );
      return total + (Number(sale.totalAmount) - paid);
    }, 0);

    return {
      todaySalesTotal: Number(todaySales._sum.totalAmount ?? 0),
      todaySalesCount: todaySales._count,
      outstandingBalance,
      lowStockCount,
      lowStockThreshold: query.lowStockThreshold,
      recentSales: recentSales.map((sale) => ({
        id: sale.id,
        totalAmount: Number(sale.totalAmount),
        status: sale.status,
        saleDate: sale.saleDate,
        customer: sale.customer,
      })),
    };
  },
};
