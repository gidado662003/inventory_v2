import { getSale } from "@/lib/api/sales/server";
import SalesSingleView from "@/app/components/sales/sales-single-view";
export default async function SaleDetailPage({
  params,
}: PageProps<"/sales/[id]">) {
  const { id } = await params;
  const sale = await getSale(id);

  return (
    <>
      <SalesSingleView sale={sale} id={id} />
    </>
  );
}
