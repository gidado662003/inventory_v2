import { Suspense } from "react";
import { getPayments } from "@/lib/api/payment/server";
import { PaymentsListView } from "@/app/components/payments/payments-list-view";
import type { PaymentsListQuery } from "@/lib/api/payment/schema";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query: PaymentsListQuery = {
    page: Number(params.page ?? 1),
    limit: Number(params.limit ?? 20),
    saleId: (params.saleId as string) || undefined,
    customerId: (params.customerId as string) || undefined,
    startDate: (params.startDate as string) || undefined,
    endDate: (params.endDate as string) || undefined,
  };

  const data = await getPayments(query);

  return (
    <Suspense fallback={<p className="text-muted">Loading...</p>}>
      <PaymentsListView data={data} />
    </Suspense>
  );
}
