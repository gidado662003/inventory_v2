import { getProducts } from "@/lib/api/product/server";
import { ProductsTable } from "@/app/components/products/products-table";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search: string;
  }>;
}) {
  const params = await searchParams;
  const products = await getProducts({
    search: params.search,
  });
  return <ProductsTable products={products} />;
}
