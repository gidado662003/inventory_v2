"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Trash2,
  ArrowLeft,
  Banknote,
  Landmark,
  Split,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ConfirmationModal } from "../ui/confirmation-modal";

import { useProducts } from "@/lib/api/product/queries";
import { useCustomers } from "@/lib/api/customer/queries";
import { useCreateSale } from "@/lib/api/sales/queries";
import { createSaleSchema } from "@/lib/api/sales/schema";

type Product = {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
  aliases?: { id: string; name: string }[];
};

type LineItem = {
  id: string;
  productId: string;
  displayName: string;
  soldAs?: string;
  quantity: string;
};

export function CreateSalePage() {
  const router = useRouter();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const createSale = useCreateSale();

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "TRANSFER" | "SPLIT"
  >("CASH");
  const [cash, setCash] = useState("");
  const [credit, setCredit] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [paidNow, setPaidNow] = useState("");
  const [creditMethod, setCreditMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [confirm, setConfirm] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          p.isActive &&
          (!q ||
            p.name.toLowerCase().includes(q) ||
            p.aliases?.some((a) => a.name.toLowerCase().includes(q))),
      )
      .slice(0, 6);
  }, [products, query]);

  function addProduct(product: Product) {
    const alias = product.aliases?.find((a) =>
      a.name.toLowerCase().includes(query.toLowerCase()),
    );
    const displayName = alias?.name ?? product.name;

    if (
      items.some(
        (i) => i.productId === product.id && i.displayName === displayName,
      )
    )
      return;

    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        productId: product.id,
        displayName,
        soldAs: alias?.name,
        quantity: "",
      },
    ]);

    setQuery("");
  }

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const p = products.find((x) => x.id === item.productId);
        return sum + (p?.price || 0) * (Number(item.quantity) || 0);
      }, 0),
    [items, products],
  );

  function submit() {
    const data = {
      customerId: credit ? customerId || undefined : undefined,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        soldAs: i.soldAs,
      })),
      payment: credit
        ? [{ amount: Number(paidNow) || 0, method: creditMethod }]
        : paymentMethod === "SPLIT"
          ? [
              { amount: Number(cash) || 0, method: "CASH" },
              {
                amount: Math.max(total - (Number(cash) || 0), 0),
                method: "TRANSFER",
              },
            ].filter((p) => p.amount > 0)
          : [{ amount: total, method: paymentMethod }],
    };

    const parsed = createSaleSchema.safeParse(data);
    if (!parsed.success) return;

    createSale.mutate(parsed.data, {
      onSuccess: () => router.push("/sales"),
    });
  }

  return (
    <div className="min-h-full ">
      {/* <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-xl font-semibold">New Sale</h1>
          <p className="text-sm text-muted-foreground">
            Add products and complete the payment
          </p>
        </div>
      </div> */}

      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-4">
          <div className="rounded-xl border bg-background p-4">
            <p className="mb-2 text-sm font-medium">Add product</p>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input
                className="pl-9"
                placeholder="Search product or alias..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              {query && filtered.length > 0 && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border bg-background shadow-lg">
                  {filtered.map((p) => {
                    const alias = p.aliases?.find((a) =>
                      a.name.toLowerCase().includes(query.toLowerCase()),
                    );

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="flex w-full items-center justify-between border-b px-4 py-3 text-left last:border-0 hover:bg-muted"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {alias?.name ?? p.name}
                          </p>

                          {alias && (
                            <p className="truncate text-xs text-muted-foreground">
                              {p.name}
                            </p>
                          )}
                        </div>

                        <span className="ml-4 shrink-0 text-sm font-medium">
                          ₦{p.price.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {query && filtered.length === 0 && (
                <div className="absolute z-50 mt-2 w-full rounded-lg border bg-background p-4 text-sm text-muted-foreground shadow-lg">
                  No products found
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-medium">Cart</h2>
              <span className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                Your cart is empty
              </div>
            ) : (
              <div className="divide-y">
                {items.toReversed().map((item) => {
                  const product = products.find((p) => p.id === item.productId);

                  if (!product) return null;

                  const itemTotal =
                    product.price * (Number(item.quantity) || 0);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.displayName}
                        </p>

                        {item.displayName !== product.name && (
                          <p className="truncate text-xs text-muted-foreground">
                            {product.name}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-muted-foreground">
                          ₦{product.price.toLocaleString()} each
                        </p>
                      </div>

                      <Input
                        variant="numeric"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          setItems(
                            items.map((i) =>
                              i.id === item.id
                                ? {
                                    ...i,
                                    quantity: e.target.value.replace(
                                      /[^0-9]/g,
                                      "",
                                    ),
                                  }
                                : i,
                            ),
                          )
                        }
                        className="w-20 text-center"
                      />

                      <span className="w-24 shrink-0 text-right text-sm font-medium">
                        ₦{itemTotal.toLocaleString()}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setItems(items.filter((i) => i.id !== item.id))
                        }
                        className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium">Payment</h2>
              <span className="text-lg font-semibold">
                ₦{total.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                variant={paymentMethod === "CASH" ? "default" : "outline"}
                onClick={() => setPaymentMethod("CASH")}
              >
                <Banknote className="h-4 w-4" />
                Cash
              </Button>

              <Button
                type="button"
                size="sm"
                variant={paymentMethod === "TRANSFER" ? "default" : "outline"}
                onClick={() => setPaymentMethod("TRANSFER")}
              >
                <Landmark className="h-4 w-4" />
                Transfer
              </Button>

              <Button
                type="button"
                size="sm"
                variant={paymentMethod === "SPLIT" ? "default" : "outline"}
                onClick={() => setPaymentMethod("SPLIT")}
              >
                <Split className="h-4 w-4" />
                Split
              </Button>
            </div>

            {paymentMethod === "SPLIT" && !credit && (
              <div className="mt-4 space-y-2">
                <Input
                  label="Cash amount"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Transfer</span>
                  <span>
                    ₦{Math.max(total - (Number(cash) || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <label className="mt-5 flex cursor-pointer items-center gap-2 border-t pt-4 text-sm">
              <input
                type="checkbox"
                checked={credit}
                onChange={(e) => setCredit(e.target.checked)}
                className="h-4 w-4"
              />
              Credit sale
            </label>

            {credit && (
              <div className="mt-4 space-y-4 rounded-lg bg-muted/40 p-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Customer
                  </label>

                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">Select customer</option>

                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Paid now"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={paidNow}
                  onChange={(e) => setPaidNow(e.target.value)}
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Payment method
                  </label>

                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={creditMethod}
                    onChange={(e) =>
                      setCreditMethod(e.target.value as "CASH" | "TRANSFER")
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">Balance</span>

                  <span className="font-semibold">
                    ₦
                    {Math.max(
                      total - (Number(paidNow) || 0),
                      0,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/sales")}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="flex-1"
              disabled={!items.length || createSale.isPending}
              onClick={() => setConfirm(true)}
            >
              {createSale.isPending ? "Creating..." : "Create Sale"}
            </Button>
          </div>
        </aside>
      </div>

      <ConfirmationModal
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={submit}
        title="Confirm Sale"
        message={
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are about to create a sale with the following items:
            </p>

            <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-3">
              <div className="space-y-2">
                {items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  const itemTotal =
                    (product?.price || 0) * (Number(item.quantity) || 0);

                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="truncate pr-4">
                        {item.displayName} × {item.quantity || 0}
                      </span>
                      <span className="shrink-0 font-medium">
                        ₦{itemTotal.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between border-t pt-2 text-sm font-semibold">
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>

            {credit && (
              <div className="text-xs text-muted-foreground">
                <p>
                  Customer:{" "}
                  {customers.find((c) => c.id === customerId)?.name ||
                    "Not selected"}
                </p>
                <p>Paid now: ₦{(Number(paidNow) || 0).toLocaleString()}</p>
                <p>
                  Balance: ₦
                  {Math.max(total - (Number(paidNow) || 0), 0).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        }
        confirmText="Create Sale"
        cancelText="Review"
      />
    </div>
  );
}
