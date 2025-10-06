import ProductDetailClient from "./ProductDetailClient";

export default  function ProductPage({ params }) {
  const { id } =  params;
  return <ProductDetailClient id={id} />;
}
