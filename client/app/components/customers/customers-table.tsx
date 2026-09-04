"use client";

import { useState } from "react";
import Link from "next/link";
import type { Customer } from "@/lib/api/customer/schema";
import {
  useCreateCustomer,
  useUpdateCustomer,
} from "@/lib/api/customer/queries";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "@/lib/api/customer/schema";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Modal } from "@/app/components/ui/modal";
import { Badge } from "@/app/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/app/components/ui/table";

type CustomerFormModalProps = {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
};

function CustomerFormModal({
  open,
  onClose,
  customer,
}: CustomerFormModalProps) {
  const isEdit = !!customer;
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer(customer?.id ?? "");
  const mutation = isEdit ? updateCustomer : createCustomer;

  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const schema = isEdit ? updateCustomerSchema : createCustomerSchema;
    const result = schema.safeParse({ name, phone: phone || undefined });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    mutation.mutate(result.data, { onSuccess: onClose });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit customer" : "New customer"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          error={fieldErrors.phone}
        />
        {mutation.isError && (
          <p className="text-sm text-danger">{mutation.error.message}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-muted">{customers.length} customers</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setModalOpen(true);
          }}
        >
          Add customer
        </Button>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Phone</TH>
            <TH>Status</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {customers.map((customer) => (
            <TR key={customer.id}>
              <TD>
                <Link
                  href={`/customers/${customer.id}`}
                  className="font-medium hover:text-accent"
                >
                  {customer.name}
                </Link>
              </TD>
              <TD>{customer.phone ?? "—"}</TD>
              <TD>
                <Badge variant={customer.isActive ? "success" : "default"}>
                  {customer.isActive ? "Active" : "Inactive"}
                </Badge>
              </TD>
              <TD>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(customer);
                    setModalOpen(true);
                  }}
                >
                  Edit
                </Button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editing}
      />
    </>
  );
}
