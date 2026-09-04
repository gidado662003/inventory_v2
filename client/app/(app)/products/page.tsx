import { getProducts } from "@/lib/api/product/server";
import { ProductsTable } from "@/app/components/products/products-table";

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductsTable products={products} />;
}
