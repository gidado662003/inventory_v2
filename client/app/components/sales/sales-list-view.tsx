"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type {
  SalesListResponse,
  SalesSummaryResponse,
} from "@/lib/api/sales/schema";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/app/components/ui/table";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils/format";
import { CreateSaleForm } from "./create-sale-form";
import { ReceiptText, ChevronLeft, ChevronRight } from "lucide-react";
import SalesSummary from "./sales-summary-view";
import { useState } from "react";

export function SalesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";

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

  return (
    <div className="flex flex-wrap gap-2">
      {[
        { value: "", label: "All" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CREDIT", label: "Credit" },
        { value: "VOIDED", label: "Voided" },
      ].map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => updateFilter("status", opt.value)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            status === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const STATUS_DOT: Record<string, string> = {
  COMPLETED: "bg-success",
  CREDIT: "bg-warning",
  VOIDED: "bg-danger",
};

export function SalesListView({
  data,
  summary,
}: {
  data: SalesListResponse;
  summary: SalesSummaryResponse;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const [salesSummaryModal, setSalesSummaryModal] = useState(false);
  const [salesPaymentModal, setSalesPaymentModal] = useState(false);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/sales?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales</h1>
          <p className="text-sm text-muted-foreground">
            {data.pagination.total} total
          </p>
        </div>
        <div>
          <Button onClick={() => setSalesSummaryModal(true)}>
            Generate Summary
          </Button>
          <Button onClick={() => setSalesPaymentModal(true)}>
            Create Sale
          </Button>
          <CreateSaleForm
            open={salesPaymentModal}
            onClose={() => setSalesPaymentModal(false)}
          />
        </div>
      </div>
      <SalesFilters />

      <div className="overflow-hidden  border border-border/60">
        <Table>
          <THead>
            <TR>
              <TH>Date</TH>
              <TH>Customer</TH>
              <TH>Status</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Items</TH>
            </TR>
          </THead>
          <TBody>
            {data.sales.length === 0 ? (
              <TR>
                <TD colSpan={5} className="p-0">
                  <div className="flex flex-col items-center gap-2 py-14 text-center">
                    <ReceiptText className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No sales yet</p>
                    <p className="text-sm text-muted-foreground">
                      Sales you record will show up here.
                    </p>
                  </div>
                </TD>
              </TR>
            ) : (
              data.sales.map((sale) => (
                <TR
                  key={sale.id}
                  className="transition-colors hover:bg-secondary/40"
                >
                  <TD>
                    <Link
                      href={`/sales/${sale.id}`}
                      className="font-medium hover:underline"
                    >
                      {formatDate(sale.saleDate)}
                    </Link>
                  </TD>
                  <TD className="text-muted-foreground">
                    {sale.customer?.name ?? "Walk-in"}
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        sale.status === "CREDIT"
                          ? "warning"
                          : sale.status === "COMPLETED"
                            ? "success"
                            : "default"
                      }
                      className="gap-1.5"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[sale.status] ?? "bg-muted-foreground"}`}
                      />
                      {formatStatus(sale.status)}
                    </Badge>
                  </TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatCurrency(sale.totalAmount)}
                  </TD>
                  <TD className="text-right text-muted-foreground tabular-nums">
                    {sale.items?.length ?? 0}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {data.pagination.page} of {data.pagination.totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= data.pagination.totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <SalesSummary
        data={summary}
        open={salesSummaryModal}
        onClose={() => setSalesSummaryModal(false)}
      />
    </div>
  );
}
