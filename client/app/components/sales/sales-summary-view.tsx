"use client";

import { cn } from "@/lib/utils/cn";
import { Modal } from "../ui/modal";
import type { SalesSummaryResponse } from "@/lib/api/sales/schema";
import { formatCurrency } from "@/lib/utils/format";
import {
  Package,
  TrendingUp,
  Clock,
  Wallet,
  CheckCircle2,
  CreditCard,
  Users,
} from "lucide-react";
import { addDays, format } from "date-fns";

function StatBlock({
  label,
  value,
  sub,
  emphasis = "default",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: "default" | "warn" | "success";
  icon?: React.ReactNode;
}) {
  const emphasisStyles = {
    default: "text-foreground",
    warn: "text-[hsl(var(--warning,38_92%_50%))]",
    success: "text-[hsl(var(--success,142_71%_45%))]",
  };

  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-1.5 text-2xl font-semibold tabular-nums leading-none",
          emphasisStyles[emphasis],
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function MethodRow({
  label,
  amount,
  count,
  color,
}: {
  label: string;
  amount: number;
  count: number;
  color: "emerald" | "sky";
}) {
  const dotColor = color === "emerald" ? "bg-emerald-500" : "bg-sky-500";

  return (
    <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2.5">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dotColor)} />
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

function CreditPaymentItem({
  customerName,
  amount,
  method,
}: {
  customerName: string;
  amount: number;
  method: "CASH" | "TRANSFER";
}) {
  const isCash = method === "CASH";
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2.5",
        "border-b border-border/60 last:border-b-0",
        "transition-colors hover:bg-muted/30",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">
          {customerName}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isCash ? "bg-emerald-500" : "bg-sky-500",
            )}
          />
          {isCash ? "Cash" : "Transfer"}
        </span>
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

function ProductRow({
  name,
  quantity,
  index,
}: {
  name: string;
  quantity: number;
  index: number;
}) {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-teal-500",
  ];
  const color = colors[index % colors.length];

  return (
    <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", color)} />
        <span className="truncate text-sm text-foreground">{name}</span>
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
        {quantity} unit{quantity !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 px-4 py-6 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionHeading({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {icon}
      {children}
    </h4>
  );
}

function getDisplayDate(dateString: string): string {
  const [y, m, d] = dateString.split("-").map(Number);
  const localDate = new Date(y, (m ?? 1) - 1, d ?? 1);
  return format(addDays(localDate, 1), "MMM d, yyyy");
}

function SalesSummary({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: SalesSummaryResponse | undefined;
}) {
  if (!data) return null;

  const { sales, paymentsReceivedToday, totalProduct } = data;
  const hasCustomerPayments = paymentsReceivedToday.length > 0;
  const hasProducts = totalProduct.length > 0;
  const totalPaymentCount =
    sales.byPaymentMethod.CASH.count + sales.byPaymentMethod.TRANSFER.count;
  const totalUnits = totalProduct.reduce((sum, p) => sum + p.totalQuantity, 0);
  const displayDate = getDisplayDate(data.date);

  // Calculate totals
  const totalCashAmount = sales.byPaymentMethod.CASH.amount;
  const totalTransferAmount = sales.byPaymentMethod.TRANSFER.amount;
  const totalPaidToday = totalCashAmount + totalTransferAmount;

  return (
    <Modal
      title={
        <div className="flex items-baseline gap-2">
          <span>Sales Summary</span>
          <span className="text-sm font-normal text-muted-foreground">
            {displayDate}
          </span>
        </div>
      }
      open={open}
      onClose={onClose}
      size="full"
      hideDefaultClose={false}
    >
      <div className="space-y-6 pt-2">
        {/* ===== TOP ROW: Key Metrics ===== */}
        <div className="grid grid-cols-4 gap-3">
          <StatBlock
            label="Total Sales"
            value={formatCurrency(sales.totalAmount)}
            sub={`${sales.count} transactions`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatBlock
            label="Paid Today"
            value={formatCurrency(totalPaidToday)}
            sub={`${totalPaymentCount} payments`}
            icon={<CreditCard className="h-4 w-4" />}
          />
          <StatBlock
            label="Outstanding"
            value={formatCurrency(sales.outstandingBalance)}
            emphasis={sales.outstandingBalance > 0 ? "warn" : "success"}
            sub={
              sales.outstandingBalance > 0
                ? `${sales.count - totalPaymentCount} unpaid`
                : "Fully settled"
            }
            icon={
              sales.outstandingBalance > 0 ? (
                <Clock className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )
            }
          />
          <StatBlock
            label="Customers"
            value={String(paymentsReceivedToday.length)}
            sub={`${totalUnits} units sold`}
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        {/* ===== BOTTOM ROW: 3 Columns ===== */}
        <div className="grid grid-cols-3 gap-6">
          {/* Payment Methods */}
          <section>
            <SectionHeading icon={<Wallet className="h-3.5 w-3.5" />}>
              Payment Methods
            </SectionHeading>
            <div className="rounded-xl border border-border bg-background px-4 py-1">
              <div className="divide-y divide-border/60">
                <MethodRow
                  label="Cash"
                  amount={sales.byPaymentMethod.CASH.amount}
                  count={sales.byPaymentMethod.CASH.count}
                  color="emerald"
                />
                <MethodRow
                  label="Transfer"
                  amount={sales.byPaymentMethod.TRANSFER.amount}
                  count={sales.byPaymentMethod.TRANSFER.count}
                  color="sky"
                />
              </div>
            </div>
          </section>

          {/* Credit Payments */}
          <section>
            <SectionHeading>Credit Payments</SectionHeading>
            {hasCustomerPayments ? (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border scrollbar-thin scrollbar-thumb-muted-foreground/20">
                {paymentsReceivedToday.flatMap((customer) =>
                  customer.payments.map((payment) => (
                    <CreditPaymentItem
                      key={payment.paymentId}
                      customerName={customer.customerName}
                      amount={payment.amount}
                      method={payment.method}
                    />
                  )),
                )}
              </div>
            ) : (
              <EmptyState label="No credit payments" />
            )}
          </section>

          {/* Products Sold */}
          <section>
            <SectionHeading icon={<Package className="h-3.5 w-3.5" />}>
              Products Sold
            </SectionHeading>
            {hasProducts ? (
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="max-h-32 divide-y divide-border/60 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                  {totalProduct.map((product, index) => (
                    <ProductRow
                      key={product.productId}
                      name={product.productName}
                      quantity={product.totalQuantity}
                      index={index}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
                  <span>Total units</span>
                  <span className="font-medium tabular-nums">{totalUnits}</span>
                </div>
              </div>
            ) : (
              <EmptyState label="No products sold" />
            )}
          </section>
        </div>
      </div>
    </Modal>
  );
}

export default SalesSummary;
