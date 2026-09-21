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
  Banknote,
  Users,
  History,
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

function SplitBar({
  fromTodaysSales,
  fromOlderBalances,
}: {
  fromTodaysSales: number;
  fromOlderBalances: number;
}) {
  const total = fromTodaysSales + fromOlderBalances;
  if (total === 0) return null;

  const todayPct = (fromTodaysSales / total) * 100;
  const olderPct = 100 - todayPct;

  return (
    <div className="mt-3 border-t border-border/60 pt-2.5">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {todayPct > 0 && (
          <div className="bg-sky-500" style={{ width: `${todayPct}%` }} />
        )}

        {olderPct > 0 && (
          <div className="bg-amber-500" style={{ width: `${olderPct}%` }} />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Today {formatCurrency(fromTodaysSales)}
        </span>

        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Older {formatCurrency(fromOlderBalances)}
        </span>
      </div>
    </div>
  );
}

function CreditPaymentItem({
  customerName,
  amount,
  method,
  appliedToTodaysSales,
  appliedToOlderBalances,
}: {
  customerName: string;
  amount: number;
  method: "CASH" | "TRANSFER";
  appliedToTodaysSales: number;
  appliedToOlderBalances: number;
}) {
  const isCash = method === "CASH";
  const hasSplit = appliedToTodaysSales > 0 && appliedToOlderBalances > 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2.5",
        "border-b border-border/60 last:border-b-0",
        "transition-colors hover:bg-muted/30",
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-foreground">
          {customerName}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              isCash ? "bg-emerald-500" : "bg-sky-500",
            )}
          />

          <span>{isCash ? "Cash" : "Transfer"}</span>

          {hasSplit && (
            <>
              <span className="text-muted-foreground/50">·</span>

              <span className="truncate">
                <span className="text-sky-600 dark:text-sky-400">
                  {formatCurrency(appliedToTodaysSales)}
                </span>{" "}
                today
                <span className="text-muted-foreground/50"> · </span>
                <span className="text-amber-600 dark:text-amber-400">
                  {formatCurrency(appliedToOlderBalances)}
                </span>{" "}
                old
              </span>
            </>
          )}
        </span>
      </div>

      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
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

  const { cashReceived, sales, paymentsReceivedToday, totalProduct } = data;

  const hasCustomerPayments = paymentsReceivedToday.length > 0;

  const hasProducts = totalProduct.length > 0;

  const totalUnits = totalProduct.reduce(
    (sum, product) => sum + product.totalQuantity,
    0,
  );

  const totalCreditPaymentTransactions = paymentsReceivedToday.reduce(
    (total, customer) => total + customer.transactions.length,
    0,
  );

  const displayDate = getDisplayDate(data.date);

  const paidPercent =
    sales.totalAmount > 0
      ? Math.min(100, (sales.paidAgainstTodaysSales / sales.totalAmount) * 100)
      : 0;

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
            label="Cash Received"
            value={formatCurrency(cashReceived.total.amount)}
            sub={`${cashReceived.total.count} payment${
              cashReceived.total.count === 1 ? "" : "s"
            }`}
            emphasis="success"
            icon={<Banknote className="h-4 w-4" />}
          />

          <StatBlock
            label="From Today's Sales"
            value={formatCurrency(cashReceived.fromTodaysSales.amount)}
            sub={`${cashReceived.fromTodaysSales.count} payment${
              cashReceived.fromTodaysSales.count === 1 ? "" : "s"
            }`}
            icon={<TrendingUp className="h-4 w-4" />}
          />

          <StatBlock
            label="From Older Balances"
            value={formatCurrency(cashReceived.fromOlderBalances.amount)}
            sub={`${cashReceived.fromOlderBalances.count} payment${
              cashReceived.fromOlderBalances.count === 1 ? "" : "s"
            }`}
            icon={<History className="h-4 w-4" />}
          />

          <StatBlock
            label="Sold Today"
            value={formatCurrency(sales.totalAmount)}
            sub={`${sales.count} sale${sales.count === 1 ? "" : "s"}`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        {/* ===== SECONDARY ROW: Outstanding + Credit Payers ===== */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Outstanding on Today's Sales
              </p>

              <span
                className={cn(
                  "text-muted-foreground/70",
                  sales.outstandingBalance > 0
                    ? "text-[hsl(var(--warning,38_92%_50%))]"
                    : "text-[hsl(var(--success,142_71%_45%))]",
                )}
              >
                {sales.outstandingBalance > 0 ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </span>
            </div>

            <p
              className={cn(
                "mt-1.5 text-2xl font-semibold tabular-nums leading-none",
                sales.outstandingBalance > 0
                  ? "text-[hsl(var(--warning,38_92%_50%))]"
                  : "text-[hsl(var(--success,142_71%_45%))]",
              )}
            >
              {formatCurrency(sales.outstandingBalance)}
            </p>

            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {formatCurrency(sales.paidAgainstTodaysSales)} of{" "}
                {formatCurrency(sales.totalAmount)} paid
              </span>

              <span className="tabular-nums">{paidPercent.toFixed(0)}%</span>
            </div>

            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  paidPercent >= 100 ? "bg-emerald-500" : "bg-sky-500",
                )}
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>

          <StatBlock
            label="Credit Payers"
            value={String(paymentsReceivedToday.length)}
            sub={`${totalCreditPaymentTransactions} repayment${
              totalCreditPaymentTransactions === 1 ? "" : "s"
            }`}
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        {/* ===== BOTTOM ROW: 3 Columns ===== */}
        <div className="grid grid-cols-3 gap-6">
          {/* Cash by Method */}
          <section>
            <SectionHeading icon={<Wallet className="h-3.5 w-3.5" />}>
              Cash by Method
            </SectionHeading>

            <div className="rounded-xl border border-border bg-background px-4 py-1">
              <div className="divide-y divide-border/60">
                <MethodRow
                  label="Cash"
                  amount={cashReceived.byMethod.CASH.amount}
                  count={cashReceived.byMethod.CASH.count}
                  color="emerald"
                />

                <MethodRow
                  label="Transfer"
                  amount={cashReceived.byMethod.TRANSFER.amount}
                  count={cashReceived.byMethod.TRANSFER.count}
                  color="sky"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/60 py-2.5 text-xs">
                <span className="text-muted-foreground">Total received</span>

                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(cashReceived.total.amount)}
                </span>
              </div>

              <SplitBar
                fromTodaysSales={cashReceived.fromTodaysSales.amount}
                fromOlderBalances={cashReceived.fromOlderBalances.amount}
              />
            </div>
          </section>

          {/* Credit Payments */}
          <section>
            <SectionHeading>Credit Payments</SectionHeading>

            {hasCustomerPayments ? (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border scrollbar-thin scrollbar-thumb-muted-foreground/20">
                {paymentsReceivedToday.flatMap((customer) =>
                  customer.transactions.map((transaction) => (
                    <CreditPaymentItem
                      key={transaction.transactionId}
                      customerName={customer.customerName}
                      amount={transaction.amount}
                      method={transaction.method}
                      appliedToTodaysSales={transaction.appliedToTodaysSales}
                      appliedToOlderBalances={
                        transaction.appliedToOlderBalances
                      }
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
