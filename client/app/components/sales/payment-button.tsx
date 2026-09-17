"use client";

import { useState } from "react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { Input } from "../ui/input";

import { useCreatePayment } from "@/lib/api/payment/queries";
import { useCreateCustomerPayment } from "@/lib/api/customer/queries";

import {
  createPaymentSchema,
  createCustomerPaymentSchema,
} from "@/lib/api/payment/schema";

type AddPaymentButtonProps =
  | {
      type: "sale";
      saleId: string;
      amountLeft: number;
    }
  | {
      type: "customer";
      customerId: string;
      amountLeft: number;
    };

export function AddPaymentButton(props: AddPaymentButtonProps) {
  const { amountLeft, type } = props;

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [error, setError] = useState<string | null>(null);

  const { mutate: createPayment, isPending: isPaymentPending } =
    useCreatePayment();

  const { mutate: createCustomerPayment, isPending: isCustomerPaymentPending } =
    useCreateCustomerPayment();

  const isPending = isPaymentPending || isCustomerPaymentPending;

  function handleClose() {
    setOpen(false);
    setAmount("");
    setMethod("CASH");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const paymentAmount = Number(amount);

    if (paymentAmount > amountLeft) {
      setError(`Amount can't exceed balance of ${amountLeft}`);
      return;
    }

    if (type === "customer") {
      const parsed = createCustomerPaymentSchema.safeParse({
        customerId: props.customerId,
        amount: paymentAmount,
        method,
      });

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid payment");
        return;
      }

      createCustomerPayment(parsed.data, {
        onSuccess: handleClose,
        onError: (err) => setError(err.message ?? "Failed to record payment"),
      });

      return;
    }

    const parsed = createPaymentSchema.safeParse({
      saleId: props.saleId,
      amount: paymentAmount,
      method,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid payment");
      return;
    }

    createPayment(parsed.data, {
      onSuccess: handleClose,
      onError: (err) => setError(err.message ?? "Failed to record payment"),
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add payment</Button>

      <Modal title="Add payment" open={open} onClose={handleClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="mb-1 block text-sm font-medium">
              Amount
            </label>

            <Input
              id="amount"
              variant="numeric"
              max={amountLeft}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder={`Balance: ${amountLeft}`}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="method" className="mb-1 block text-sm font-medium">
              Method
            </label>

            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value as "CASH" | "TRANSFER")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="CASH">Cash</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>

          {error && <p className="text-sm text-warning">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save payment"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
