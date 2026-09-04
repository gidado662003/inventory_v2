import Link from "next/link";
import { getDashboardSummary } from "@/lib/api/dashboard/server";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils/format";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-foreground">Overview of your business today</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
        <Card className="md:col-span-2 md:row-span-2">
          <p className="text-sm text-foreground">Today&apos;s sales</p>
          <p className="mt-2 text-4xl font-semibold">
            {formatCurrency(summary.todaySalesTotal)}
          </p>
          <p className="mt-2 text-sm text-foreground">
            {summary.todaySalesCount} transaction
            {summary.todaySalesCount !== 1 ? "s" : ""}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-foreground">Outstanding</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(summary.outstandingBalance)}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-foreground">Low stock</p>
          <p className="mt-2 text-2xl font-semibold">{summary.lowStockCount}</p>
          <p className="mt-1 text-xs text-foreground">
            Threshold: {summary.lowStockThreshold} units
          </p>
        </Card>

        <Card className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent sales</h2>
            <Link href="/sales" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {summary.recentSales.length === 0 ? (
              <p className="text-sm text-foreground">No recent sales</p>
            ) : (
              summary.recentSales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-border/30"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {sale.customer?.name ?? "Walk-in"}
                    </p>
                    <p className="text-xs text-foreground">
                      {formatDate(sale.saleDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        sale.status === "COMPLETED"
                          ? "success"
                          : sale.status === "CREDIT"
                            ? "warning"
                            : "default"
                      }
                    >
                      {formatStatus(sale.status)}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(sale.totalAmount)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
