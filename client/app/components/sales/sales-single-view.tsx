import React from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/app/components/ui/table";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils/format";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sale } from "@/lib/api/sales/schema";
import { AddPaymentButton } from "./payment-button";
function SalesSingleView({ sale, id }: { sale: Sale; id: string }) {
  const totalPaid = sale.totalPaid ?? 0;
  const balance = sale.balance ?? sale.totalAmount - totalPaid;
  const isSettled = balance <= 0;
  return (
    <div>
      <div className="space-y-8">
        <div className="flex justify-between">
          <Link
            href="/sales"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sales
          </Link>
          {sale.status === "CREDIT" && (
            <AddPaymentButton saleId={id} amountLeft={balance} type="sale" />
          )}
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Sale</h1>
            <p className="text-muted-foreground">{formatDate(sale.saleDate)}</p>
          </div>
          <Badge
            variant={
              sale.status === "CREDIT"
                ? "warning"
                : sale.status === "COMPLETED"
                  ? "success"
                  : "default"
            }
          >
            {formatStatus(sale.status)}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="mt-1 font-medium">
              {sale.customer ? (
                <Link
                  href={`/customers/${sale.customer.id}`}
                  className="text-muted-foreground hover:underline"
                >
                  {sale.customer.name}
                </Link>
              ) : (
                "Walk-in"
              )}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(sale.totalAmount)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(totalPaid)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p
              className={`mt-1 text-xl font-semibold ${
                isSettled ? "text-success" : "text-warning"
              }`}
            >
              {formatCurrency(balance)}
            </p>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 font-semibold">Line items</h2>
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH>Qty</TH>
                <TH>Unit price</TH>
                <TH>Subtotal</TH>
              </TR>
            </THead>
            <TBody>
              {sale.items?.map((item) => (
                <TR key={item.id}>
                  <TD>{item.soldAs ?? item.product?.name}</TD>
                  <TD>{item.quantity}</TD>
                  <TD>{formatCurrency(item.unitPrice)}</TD>
                  <TD>{formatCurrency(item.subtotal)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        <div>
          <h2 className="mb-4 font-semibold">Payments</h2>
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Method</TH>
                <TH>Amount</TH>
              </TR>
            </THead>
            <TBody>
              {sale.payments?.length ? (
                <>
                  {sale.payments.map((payment) => (
                    <TR key={payment.id}>
                      <TD>{formatDate(payment.paymentDate)}</TD>
                      <TD>{payment.method}</TD>
                      <TD>{formatCurrency(payment.amount)}</TD>
                    </TR>
                  ))}
                  <TR className="border-t border-border font-medium">
                    <TD colSpan={2}>Total paid</TD>
                    <TD>{formatCurrency(totalPaid)}</TD>
                  </TR>
                </>
              ) : (
                <TR>
                  <TD colSpan={3} className="text-muted-foreground">
                    No payments recorded
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default SalesSingleView;
