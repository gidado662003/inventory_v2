"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCreateSale } from "@/lib/api/sales/queries";
import { useProducts } from "@/lib/api/product/queries";
import { useCustomers } from "@/lib/api/customer/queries";
import { createSaleSchema } from "@/lib/api/sales/schema";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Modal } from "@/app/components/ui/modal";
import {
  Banknote,
  Landmark,
  Search,
  ShoppingCart,
  Split,
  Trash2,
  X,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  aliases?: {
    id: string;
    name: string;
    productId: string;
    createdAt?: string;
  }[];
};

type LineItem = {
  id: string;
  productId: string;
  quantity: string;
  displayName: string;
  soldAs?: string;
};

type Payment = {
  amount: number;
  method: "CASH" | "TRANSFER";
};

type ProductSearchProps = {
  products: Product[];
  onAdd: (productId: string, displayName: string) => void;
};

function ProductSearch({ products, onAdd }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return products.filter((product) => product.isActive).slice(0, 6);
    }

    return products
      .filter((product) => {
        const nameMatches = product.name.toLowerCase().includes(search);

        const aliasMatches = product.aliases?.some((alias) =>
          alias.name.toLowerCase().includes(search),
        );

        return nameMatches || aliasMatches;
      })
      .filter((product) => product.isActive)
      .slice(0, 6);
  }, [products, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSelectProduct(product: Product) {
    const search = query.trim().toLowerCase();

    const aliasMatch = product.aliases?.find((alias) =>
      alias.name.toLowerCase().includes(search),
    );

    const displayName = aliasMatch?.name ?? product.name;

    onAdd(product.id, displayName);

    setQuery("");
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search product..."
          className="pl-9 pr-9"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-background shadow-md">
          {filtered.map((product) => {
            const search = query.trim().toLowerCase();

            const aliasMatch = product.aliases?.find((alias) =>
              alias.name.toLowerCase().includes(search),
            );

            const displayName = aliasMatch?.name ?? product.name;

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelectProduct(product)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{displayName}</p>

                  {displayName !== product.name && (
                    <p className="truncate text-xs text-muted-foreground">
                      {product.name}
                    </p>
                  )}
                </div>

                <span className="ml-3 shrink-0 text-sm text-muted-foreground">
                  ₦{product.price.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background p-3 text-sm text-muted-foreground shadow-md">
          No products found
        </div>
      )}
    </div>
  );
}

type CreateSaleFormProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateSaleForm({ open, onClose }: CreateSaleFormProps) {
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const createSale = useCreateSale();

  const [items, setItems] = useState<LineItem[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "TRANSFER" | "SPLIT"
  >("CASH");

  const [cashAmount, setCashAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [isCredit, setIsCredit] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [creditPaid, setCreditPaid] = useState("");
  const [creditMethod, setCreditMethod] = useState<"CASH" | "TRANSFER">("CASH");

  const [errors, setErrors] = useState<{
    quantity?: string;
    customer?: string;
    payment?: string;
  }>({});

  function addProduct(productId: string, displayName: string) {
    setItems((prev) => {
      const exists = prev.some(
        (item) =>
          item.productId === productId && item.displayName === displayName,
      );

      if (exists) {
        return prev;
      }

      const product = products.find((p) => p.id === productId);
      const aliasMatch = product?.aliases?.find(
        (alias) => alias.name === displayName,
      );

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          productId,
          quantity: "",
          displayName,
          soldAs: aliasMatch?.name,
        },
      ];
    });
  }

  function updateQuantity(lineItemId: string, quantity: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === lineItemId
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    );
  }

  function removeItem(lineItemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== lineItemId));
  }

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = products.find((product) => product.id === item.productId);

      if (!product) return sum;

      return sum + product.price * (Number(item.quantity) || 0);
    }, 0);
  }, [items, products]);

  const creditPaidNumber = Number(creditPaid) || 0;

  const creditBalance = Math.max(total - creditPaidNumber, 0);

  function getPayments(): Payment[] {
    if (isCredit) {
      return [
        {
          amount: creditPaidNumber,
          method: creditMethod,
        },
      ];
    }

    if (paymentMethod === "CASH") {
      return [
        {
          amount: total,
          method: "CASH",
        },
      ];
    }

    if (paymentMethod === "TRANSFER") {
      return [
        {
          amount: total,
          method: "TRANSFER",
        },
      ];
    }

    const cash = Math.min(Number(cashAmount) || 0, total);

    const transfer = Math.max(total - cash, 0);

    const payments: Payment[] = [];

    if (cash > 0) {
      payments.push({
        amount: cash,
        method: "CASH",
      });
    }

    if (transfer > 0) {
      payments.push({
        amount: transfer,
        method: "TRANSFER",
      });
    }

    return payments;
  }

  function resetForm() {
    setItems([]);
    setPaymentMethod("CASH");
    setCashAmount("");
    setTransferAmount("");
    setIsCredit(false);
    setCustomerId("");
    setCreditPaid("");
    setCreditMethod("CASH");
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit() {
    const newErrors: typeof errors = {};

    if (items.length === 0) {
      newErrors.quantity = "Add at least one product";
    }

    if (
      items.some(
        (item) =>
          !item.quantity ||
          Number(item.quantity) <= 0 ||
          !Number.isInteger(Number(item.quantity)),
      )
    ) {
      newErrors.quantity = "Enter a valid quantity for all products";
    }

    if (isCredit && !customerId) {
      newErrors.customer = "Select a customer for credit sales";
    }

    if (isCredit && creditPaidNumber > total) {
      newErrors.payment = "Amount paid cannot be greater than the total";
    }

    if (
      !isCredit &&
      paymentMethod === "SPLIT" &&
      (Number(cashAmount) || 0) > total
    ) {
      newErrors.payment = "Cash amount cannot be greater than the total";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data = {
      customerId: customerId || undefined,

      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        soldAs: item.soldAs || undefined,
      })),

      payment: getPayments(),
    };

    const result = createSaleSchema.safeParse(data);

    if (!result.success) {
      setErrors({
        payment: "Please check the sale details",
      });
      return;
    }

    setErrors({});

    createSale.mutate(result.data, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Sale"
      size="full"
      hideDefaultClose
    >
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Products */}
        <div className="space-y-4 lg:col-span-3">
          <div>
            <h3 className="mb-2 text-sm font-medium">Products</h3>

            <ProductSearch products={products} onAdd={addProduct} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {products
              .filter((product) => product.isActive)
              .slice(0, 6)
              .map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product.id, product.name)}
                  className="rounded-md border p-3 text-left transition hover:bg-muted"
                >
                  <p className="truncate text-sm font-medium">{product.name}</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    ₦{product.price.toLocaleString()}
                  </p>
                </button>
              ))}
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />

              <h3 className="text-sm font-medium">Cart</h3>
            </div>

            <span className="text-sm text-muted-foreground">
              {items.length} item
              {items.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {items.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Cart is empty
              </div>
            ) : (
              items.map((item) => {
                const product = products.find(
                  (product) => product.id === item.productId,
                );

                if (!product) return null;

                const itemTotal = product.price * (Number(item.quantity) || 0);

                return (
                  <div key={item.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.displayName}
                        </p>

                        {item.displayName !== product.name && (
                          <p className="truncate text-xs text-muted-foreground">
                            {product.name}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          ₦{product.price.toLocaleString()} each
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <Input
                        type="number"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, e.target.value)
                        }
                        className="w-20 text-center text-sm"
                      />

                      <span className="text-sm font-medium">
                        ₦{itemTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>

              <span className="text-xl font-semibold">
                ₦{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="mt-6 space-y-4 border-t pt-6">
        <h3 className="text-sm font-medium">Payment</h3>

        {!isCredit && (
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={paymentMethod === "CASH" ? "default" : "outline"}
              onClick={() => setPaymentMethod("CASH")}
              className="gap-2"
            >
              <Banknote className="h-4 w-4" />
              Cash
            </Button>

            <Button
              type="button"
              variant={paymentMethod === "TRANSFER" ? "default" : "outline"}
              onClick={() => setPaymentMethod("TRANSFER")}
              className="gap-2"
            >
              <Landmark className="h-4 w-4" />
              Transfer
            </Button>

            <Button
              type="button"
              variant={paymentMethod === "SPLIT" ? "default" : "outline"}
              onClick={() => setPaymentMethod("SPLIT")}
              className="gap-2"
            >
              <Split className="h-4 w-4" />
              Split
            </Button>
          </div>
        )}

        {paymentMethod === "SPLIT" && !isCredit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Cash"
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="0"
            />

            <Input
              label="Transfer"
              type="number"
              value={
                total > 0
                  ? String(Math.max(total - (Number(cashAmount) || 0), 0))
                  : transferAmount
              }
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            id="credit"
            type="checkbox"
            checked={isCredit}
            onChange={(e) => setIsCredit(e.target.checked)}
            className="h-4 w-4"
          />

          <label htmlFor="credit" className="text-sm font-medium">
            Credit sale
          </label>
        </div>

        {isCredit && (
          <div className="space-y-4 rounded-md border p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Customer
              </label>

              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Amount paid now"
                type="number"
                value={creditPaid}
                onChange={(e) => setCreditPaid(e.target.value)}
                placeholder="0"
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Payment method
                </label>

                <select
                  value={creditMethod}
                  onChange={(e) =>
                    setCreditMethod(e.target.value as "CASH" | "TRANSFER")
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">Balance</span>

              <span className="font-semibold">
                ₦{creditBalance.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {errors.quantity && (
          <p className="text-sm text-destructive">{errors.quantity}</p>
        )}

        {errors.customer && (
          <p className="text-sm text-destructive">{errors.customer}</p>
        )}

        {errors.payment && (
          <p className="text-sm text-destructive">{errors.payment}</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={handleClose}>
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={createSale.isPending || items.length === 0}
        >
          {createSale.isPending ? "Creating..." : "Create Sale"}
        </Button>
      </div>
    </Modal>
  );
}
