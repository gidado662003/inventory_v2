import { getMovements } from "@/lib/api/inventory/server";
import { InventoryListView } from "@/app/components/inventory/inventory-list-view";
import type { MovementsListQuery } from "@/lib/api/inventory/schema";

type InventoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params = await searchParams;

  const query: MovementsListQuery = {
    ...(typeof params.startDate === "string" && {
      startDate: params.startDate,
    }),
    ...(typeof params.endDate === "string" && {
      endDate: params.endDate,
    }),
    ...(typeof params.type === "string" && {
      type: params.type as MovementsListQuery["type"],
    }),
    ...(typeof params.search === "string" &&
      params.search.trim() && {
        search: params.search.trim(),
      }),
    page:
      typeof params.page === "string"
        ? Math.max(1, Number(params.page) || 1)
        : 1,
    limit: 50,
  };

  const data = await getMovements(query);

  return <InventoryListView data={data} />;
}
