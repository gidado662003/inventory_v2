import { getCustomer } from "@/lib/api/customer/server";
import { CustomerDetailView } from "@/app/components/customers/customer-detail-view";

export default async function CustomerDetailPage({
  params,
}: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const customer = await getCustomer(id);
  return <CustomerDetailView customer={customer} />;
}
