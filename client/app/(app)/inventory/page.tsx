import { getMovements } from "@/lib/api/inventory/server";
import { InventoryListView } from "@/app/components/inventory/inventory-list-view";

export default async function InventoryPage() {
  const data = await getMovements({ page: 1, limit: 50 });
  return <InventoryListView data={data} />;
}
