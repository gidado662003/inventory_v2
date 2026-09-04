"use client";

import { useState } from "react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { useCreatePayment } from "@/lib/api/payment/queries";
import { createPaymentSchema } from "@/lib/api/payment/schema";
import { Input } from "../ui/input";
export function AddPaymentButton({
  saleId,
  amountLeft,
}: {
  saleId: string;
  amountLeft: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useCreatePayment();

  function handleClose() {
    setOpen(false);
    setAmount("");
    setMethod("CASH");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = createPaymentSchema.safeParse({
      saleId,
      amount: Number(amount),
      method,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid payment");
      return;
    }

    if (parsed.data.amount > amountLeft) {
      setError(`Amount can't exceed balance of ${amountLeft}`);
      return;
    }

    mutate(parsed.data, {
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
