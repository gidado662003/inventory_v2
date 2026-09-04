"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreatePayment } from "@/lib/api/payment/queries";
import { createPaymentSchema } from "@/lib/api/payment/schema";
import type { PaymentsListResponse } from "@/lib/api/payment/schema";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Modal } from "@/app/components/ui/modal";
import { Table, THead, TBody, TR, TH, TD } from "@/app/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils/format";

function PaymentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/payments?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <input
        className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
        placeholder="Sale ID"
        defaultValue={searchParams.get("saleId") ?? ""}
        onBlur={(e) => updateFilter("saleId", e.target.value)}
      />
      <input
        className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
        placeholder="Customer ID"
        defaultValue={searchParams.get("customerId") ?? ""}
        onBlur={(e) => updateFilter("customerId", e.target.value)}
      />
    </div>
  );
}

function CreatePaymentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createPayment = useCreatePayment();
  const [saleId, setSaleId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = createPaymentSchema.safeParse({
      saleId,
      amount: Number(amount),
      method,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    createPayment.mutate(result.data, { onSuccess: onClose });
  }

  return (
    <Modal open={open} onClose={onClose} title="Record payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Sale ID"
          value={saleId}
          onChange={(e) => setSaleId(e.target.value)}
          error={fieldErrors.saleId}
        />
        <Input
          label="Amount"
          variant="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={fieldErrors.amount}
        />
        <div>
          <label className="mb-2 block text-sm font-medium">Method</label>
          <select
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
            value={method}
            onChange={(e) => setMethod(e.target.value as "CASH" | "TRANSFER")}
          >
            <option value="CASH">Cash</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>
        {createPayment.isError && (
          <p className="text-sm text-danger">{createPayment.error.message}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createPayment.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function PaymentsListView({ data }: { data: PaymentsListResponse }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-muted">{data.pagination.total} total</p>
        </div>
        {/* <Button onClick={() => setModalOpen(true)}>Record payment</Button> */}
      </div>

      <PaymentFilters />

      <Table className="mt-6">
        <THead>
          <TR>
            <TH>Date</TH>
            <TH>Customer</TH>
            <TH>Method</TH>
            <TH>Amount</TH>
          </TR>
        </THead>
        <TBody>
          {data.payments.map((payment) => (
            <TR key={payment.id}>
              <TD>{formatDate(payment.paymentDate)}</TD>
              <TD>{payment.sale?.customer?.name ?? "—"}</TD>
              <TD>{payment.method}</TD>
              <TD>{formatCurrency(payment.amount)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <CreatePaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
