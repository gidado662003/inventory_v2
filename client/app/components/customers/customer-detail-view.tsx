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
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/app/components/ui/table";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils/format";

export function CustomerDetailView({ customer }: { customer: CustomerDetail }) {
  const updateCustomer = useUpdateCustomer(customer.id);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-semibold">{customer.name}</h1>
        <p className="text-muted-foreground">{customer.phone ?? "No phone"}</p>
      </div>

      <Card>
        <p className="text-sm text-muted-foreground">Total owed</p>
        <p className="mt-1 text-2xl font-semibold text-warning">
          {formatCurrency(customer.totalOwed)}
        </p>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Sales history</h2>
        <Table>
          <THead>
            <TR>
              <TH>Date</TH>
              <TH>Status</TH>
              <TH>Total</TH>
              <TH>Balance</TH>
            </TR>
          </THead>
          <TBody>
            {customer.sales.map((sale) => (
              <TR key={sale.id}>
                <TD>
                  <Link
                    href={`/sales/${sale.id}`}
                    className="hover:text-accent"
                  >
                    {formatDate(sale.saleDate)}
                  </Link>
                </TD>
                <TD>
                  <Badge
                    variant={sale.status === "CREDIT" ? "warning" : "success"}
                  >
                    {formatStatus(sale.status)}
                  </Badge>
                </TD>
                <TD>{formatCurrency(sale.totalAmount)}</TD>
                <TD>{formatCurrency(sale.balance)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
      <Card>
        <h2 className="mb-4 font-semibold">Edit customer</h2>
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
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
            Save
          </Button>
        </form>
      </Card>
    </div>
  );
}
