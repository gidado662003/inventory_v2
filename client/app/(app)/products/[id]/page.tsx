import { getProduct } from "@/lib/api/product/server";
import { ProductDetailForm } from "@/app/components/products/product-detail-form";

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = await getProduct(id);
  console.log("🚀 ~ ProductDetailPage ~ product:", product);
  return <ProductDetailForm product={product} />;
}
