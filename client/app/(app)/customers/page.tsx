import { getCustomers } from "@/lib/api/customer/server";
import { CustomersTable } from "@/app/components/customers/customers-table";

export default async function CustomersPage() {
  const customers = await getCustomers();
  return <CustomersTable customers={customers} />;
}
