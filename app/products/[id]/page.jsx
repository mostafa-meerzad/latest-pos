import ProductDetailClient from "./ProductDetailClient";

export default async function ProductPage({ params }) {
  const { id } =  await params;
  return <ProductDetailClient id={id} />;
}
