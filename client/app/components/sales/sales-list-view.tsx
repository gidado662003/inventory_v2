"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type {
  SalesListResponse,
  SalesSummaryResponse,
  SalesIemListResponse,
} from "@/lib/api/sales/schema";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/app/components/ui/table";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils/format";

import {
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Package,
  Plus,
  BarChart3,
  User,
} from "lucide-react";

import SalesSummary from "./sales-summary-view";
import { useMemo, useState } from "react";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CREDIT", label: "Credit" },
] as const;

const VIEW_TABS = [
  { value: "sales", label: "Sales", icon: ReceiptText },
  { value: "items", label: "Items", icon: Package },
] as const;

/* -------------------------------------------------------------------------- */
/*                                  Filters                                   */
/* -------------------------------------------------------------------------- */

export function SalesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const view = searchParams.get("view") ?? "sales";

  const currentDate = startDate || new Date().toISOString().split("T")[0];

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set("page", "1");
    router.push(`/sales?${params.toString()}`);
  }

  function goToDate(direction: "prev" | "next") {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + (direction === "prev" ? -1 : 1));
    const newDate = date.toISOString().split("T")[0];

    const params = new URLSearchParams(searchParams.toString());
    params.set("startDate", newDate);
    params.set("endDate", newDate);
    params.set("page", "1");
    router.push(`/sales?${params.toString()}`);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());

    if (e.target.value) {
      params.set("startDate", e.target.value);
      params.set("endDate", e.target.value);
    } else {
      params.delete("startDate");
      params.delete("endDate");
    }

    params.set("page", "1");
    router.push(`/sales?${params.toString()}`);
  }

  function clearDate() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("startDate");
    params.delete("endDate");
    params.set("page", "1");
    router.push(`/sales?${params.toString()}`);
  }

  function goToToday() {
    const today = new Date().toISOString().split("T")[0];
    const params = new URLSearchParams(searchParams.toString());
    params.set("startDate", today);
    params.set("endDate", today);
    params.set("page", "1");
    router.push(`/sales?${params.toString()}`);
  }

  const isDateActive = Boolean(startDate && endDate);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* View switcher */}
      <div className="inline-flex w-fit items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => updateFilter("view", tab.value)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Status segmented control */}
        <div className="inline-flex w-fit items-center gap-0.5 rounded-full bg-muted p-1">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateFilter("status", opt.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                status === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background p-1 shadow-sm">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Today
          </button>

          <span className="h-4 w-px bg-border" />

          <button
            type="button"
            onClick={() => goToDate("prev")}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <label className="relative flex items-center">
            <CalendarDays className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={startDate}
              onChange={handleDateChange}
              className="h-7 w-34 rounded-md border-0 bg-transparent pl-7 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <button
            type="button"
            onClick={() => goToDate("next")}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {isDateActive && (
            <button
              type="button"
              onClick={clearDate}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
              aria-label="Clear date filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_DOT: Record<string, string> = {
  COMPLETED: "bg-success",
  CREDIT: "bg-warning",
  VOIDED: "bg-danger",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "default"> = {
  COMPLETED: "success",
  CREDIT: "warning",
};

function SalesView({ data }: { data: SalesListResponse }) {
  if (data.sales.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="divide-y divide-border/60">
      {data.sales.map((sale) => {
        const customerName = sale.customer?.name ?? "Walk-in";
        const initials = customerName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <Link
            key={sale.id}
            href={`/sales/${sale.id}`}
            className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {sale.customer ? initials : <User className="h-4 w-4" />}
            </div>

            {/* Customer + date */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {customerName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(sale.saleDate)}
              </p>
            </div>

            {/* Status */}
            <Badge
              variant={STATUS_VARIANT[sale.status] ?? "default"}
              className="hidden gap-1.5 font-medium sm:inline-flex"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  STATUS_DOT[sale.status] ?? "bg-muted-foreground"
                }`}
              />
              {formatStatus(sale.status)}
            </Badge>

            {/* Total */}
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(sale.totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground sm:hidden">
                {formatStatus(sale.status)}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </div>
  );
}

function ItemsView({
  salesItems,
  salesById,
}: {
  salesItems: SalesIemListResponse;
  salesById: Record<string, SalesListResponse["sales"][number]>;
}) {
  // Group items by sale for date headers
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        sale: SalesListResponse["sales"][number] | undefined;
        items: typeof salesItems.sales;
      }
    >();

    for (const item of salesItems.sales) {
      const sale = salesById[item.saleId];
      const key = item.saleId;
      if (!map.has(key)) {
        map.set(key, { sale, items: [] });
      }
      map.get(key)!.items.push(item);
    }

    return Array.from(map.entries()).map(([saleId, value]) => ({
      saleId,
      ...value,
    }));
  }, [salesItems.sales, salesById]);

  if (salesItems.sales.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">No items found</p>
          <p className="text-sm text-muted-foreground">
            Items from your sales will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <THead>
        <TR className="border-b border-border/60 hover:bg-transparent">
          <TH className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Product
          </TH>
          <TH className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sale
          </TH>
          <TH className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Unit Price
          </TH>
          <TH className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Qty
          </TH>
          <TH className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Subtotal
          </TH>
        </TR>
      </THead>
      <TBody>
        {grouped.map(({ saleId, sale, items }) => (
          <>
            {/* Sale group header */}
            <TR className="border-b border-border/40 bg-muted/30 hover:bg-muted/30">
              <TD colSpan={5} className="py-2">
                <Link
                  href={`/sales/${saleId}`}
                  className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ReceiptText className="h-3.5 w-3.5" />
                  <span>
                    {sale ? formatDate(sale.saleDate) : "Unknown date"}
                  </span>
                  {sale?.customer?.name && (
                    <>
                      <span className="text-border">·</span>
                      <span>{sale.customer.name}</span>
                    </>
                  )}
                  <span className="text-border">·</span>
                  <span>
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </span>
                </Link>
              </TD>
            </TR>

            {/* Items */}
            {items.map((item) => (
              <TR
                key={item.id}
                className="border-b border-border/40 transition-colors hover:bg-muted/30"
              >
                <TD>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.soldAs ?? item.product?.name ?? "Unknown product"}
                    </p>
                    {item.soldAs &&
                      item.product?.name &&
                      item.soldAs !== item.product.name && (
                        <p className="text-xs text-muted-foreground">
                          Product: {item.product.name}
                        </p>
                      )}
                  </div>
                </TD>
                <TD>
                  <Link
                    href={`/sales/${item.saleId}`}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                  >
                    View sale
                  </Link>
                </TD>
                <TD className="text-right text-sm text-muted-foreground tabular-nums">
                  {formatCurrency(item.unitPrice)}
                </TD>
                <TD className="text-right text-sm text-muted-foreground tabular-nums">
                  {item.quantity}
                </TD>
                <TD className="text-right text-sm font-semibold tabular-nums">
                  {formatCurrency(
                    item.subtotal ?? Number(item.unitPrice) * item.quantity,
                  )}
                </TD>
              </TR>
            ))}
          </>
        ))}
      </TBody>
    </Table>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <ReceiptText className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">No sales yet</p>
        <p className="text-sm text-muted-foreground">
          Sales you record will show up here.
        </p>
      </div>
    </div>
  );
}

export function SalesListView({
  data,
  summary,
  salesItems,
}: {
  data: SalesListResponse;
  summary: SalesSummaryResponse;
  salesItems: SalesIemListResponse;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const view = searchParams.get("view") ?? "items";

  const [salesSummaryModal, setSalesSummaryModal] = useState(false);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/sales?${params.toString()}`);
  }

  const salesById = useMemo(() => {
    const map: Record<string, SalesListResponse["sales"][number]> = {};
    for (const sale of data.sales) {
      map[sale.id] = sale;
    }
    return map;
  }, [data.sales]);

  // Count of items for the current page (useful for tab badge)
  const itemCount = salesItems.sales.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">
            {view === "sales"
              ? `${data.pagination.total.toLocaleString()} total transactions`
              : `${itemCount.toLocaleString()} line item${itemCount !== 1 ? "s" : ""} on this page`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => setSalesSummaryModal(true)}
          >
            <BarChart3 className="h-4 w-4" />
            Summary
          </Button>

          <Button className="gap-1.5">
            <Link href="/sales/new">
              <Plus className="h-4 w-4" />
              Create Sale
            </Link>
          </Button>
        </div>
      </div>

      <SalesFilters />

      {/* Content card */}
      <Card variant="outline" padding="none" className="overflow-hidden">
        {view === "sales" ? (
          <SalesView data={data} />
        ) : (
          <ItemsView salesItems={salesItems} salesById={salesById} />
        )}
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page{" "}
          <span className="font-medium text-foreground">
            {data.pagination.page}
          </span>{" "}
          of {data.pagination.totalPages}
        </p>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            disabled={page >= data.pagination.totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      <SalesSummary
        data={summary}
        open={salesSummaryModal}
        onClose={() => setSalesSummaryModal(false)}
      />
    </div>
  );
}
