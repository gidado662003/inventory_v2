import { Suspense } from "react";
import { getSales, getSalesSummary } from "@/lib/api/sales/server";
import { SalesListView } from "@/app/components/sales/sales-list-view";
import type { SalesListQuery } from "@/lib/api/sales/schema";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query: SalesListQuery = {
    page: Number(params.page ?? 1),
    limit: Number(params.limit ?? 20),
    status: (params.status as SalesListQuery["status"]) || undefined,
    customerId: (params.customerId as string) || undefined,
    startDate: (params.startDate as string) || undefined,
    endDate: (params.endDate as string) || undefined,
  };

  const data = await getSales(query);
  const summary = await getSalesSummary();

  return (
    <Suspense fallback={<p className="text-muted">Loading filters...</p>}>
      <SalesListView data={data} summary={summary} />
    </Suspense>
  );
}
