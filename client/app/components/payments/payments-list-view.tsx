"use client";

import { useState } from "react";

import type { TransactionPaymentsListResponse } from "@/lib/api/payment/schema";

import { Table, THead, TBody, TR, TH, TD } from "@/app/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { DatePicker } from "../ui/date-picker";

export function PaymentsListView({
  data,
}: {
  data: TransactionPaymentsListResponse;
}) {
  const [date, setDate] = useState("");
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-muted">{data.pagination.total} total</p>
        </div>
        <DatePicker
          value={date}
          onChange={setDate}
          onClear={() => setDate("")}
        />
      </div>

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
          {data.paymentsTransaction.map((payment) => (
            <TR key={payment.id}>
              <TD>{formatDate(payment.createdAt)}</TD>
              <TD>{payment.customer.name}</TD>
              <TD>{payment.method}</TD>
              <TD>{formatCurrency(payment.amount)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </>
  );
}
