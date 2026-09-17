"use client";

import { useState } from "react";
import Link from "next/link";
import { useUpdateCustomer } from "@/lib/api/customer/queries";
import {
  updateCustomerSchema,
  type CustomerDetail,
} from "@/lib/api/customer/schema";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils/format";
import { AddPaymentButton } from "../sales/payment-button";

export function CustomerDetailView({
  customer,
  id,
}: {
  customer: CustomerDetail;
  id: string;
}) {
  const updateCustomer = useUpdateCustomer(customer.id);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const owes = customer.totalOwed > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = updateCustomerSchema.safeParse({
      name,
      phone: phone || undefined,
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
    updateCustomer.mutate(result.data);
  }

  return (
    <div className="mx-auto">
      {/* Record header */}
      <div className="relative flex items-start justify-between border-b-2 border-foreground/80 pb-6">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground">
            Customer record
          </p>
          <h1 className="mt-1 font-serif text-4xl font-semibold leading-tight tracking-tight">
            {customer.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {customer.phone ?? "No phone on file"}
          </p>
        </div>

        <div
          className={`hidden shrink-0 -rotate-6 select-none rounded-sm border-2 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest sm:block ${
            owes ? "border-warning text-warning" : "border-success text-success"
          }`}
        >
          {owes ? "Owing" : "Settled"}
        </div>
      </div>

      {/* Balance statement line */}
      <div className="flex items-end justify-between border-b border-dashed border-foreground/30 py-6">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground">
            Balance due
          </p>
          <p
            className={`mt-1 font-mono text-4xl font-semibold tabular-nums ${
              owes ? "text-warning" : "text-foreground"
            }`}
          >
            {formatCurrency(customer.totalOwed)}
          </p>
        </div>
        <AddPaymentButton
          customerId={id}
          amountLeft={customer.totalOwed}
          type="customer"
        />
      </div>

      {/* Sales history */}
      <div className="py-8">
        <h2 className="font-serif text-lg font-semibold">Sales history</h2>

        {customer.sales.length === 0 ? (
          <p className="mt-4 border border-dashed border-foreground/20 px-4 py-6 text-center text-sm text-muted-foreground">
            No sales recorded for this customer yet.
          </p>
        ) : (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-foreground/80 text-left text-xs text-muted-foreground">
                <th className="py-2 font-normal">Date</th>
                <th className="py-2 font-normal">Status</th>
                <th className="py-2 text-right font-normal">Total</th>
                <th className="py-2 text-right font-normal">Balance</th>
              </tr>
            </thead>
            <tbody>
              {customer.sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-dashed border-foreground/20 last:border-b-0 hover:bg-foreground/[0.03]"
                >
                  <td className="py-3">
                    <Link
                      href={`/sales/${sale.id}`}
                      className="underline decoration-foreground/20 underline-offset-4 hover:text-accent hover:decoration-accent"
                    >
                      {formatDate(sale.saleDate)}
                    </Link>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        sale.status === "CREDIT"
                          ? "text-warning"
                          : "text-success"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          sale.status === "CREDIT" ? "bg-warning" : "bg-success"
                        }`}
                      />
                      {formatStatus(sale.status)}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {formatCurrency(sale.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit record */}
      <div className="border-t border-foreground/80 pt-6 pb-10">
        <h2 className="font-serif text-lg font-semibold">Correct record</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the name or phone number on file for this customer.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {updateCustomer.isError && (
            <p className="text-sm text-danger">
              {updateCustomer.error.message}
            </p>
          )}
          <Button type="submit" disabled={updateCustomer.isPending}>
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
