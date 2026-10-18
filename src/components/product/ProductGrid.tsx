import type { Product } from "../../types/catalog";
import Reveal from "../motion/Reveal";
import ProductCard from "./ProductCard";

type ProductGridProps = {
  products: Product[];
};

// Cards rise into place row by row as the grid scrolls into view.
function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <Reveal key={product.id} delay={(index % 4) * 0.08}>
          <ProductCard product={product} />
        </Reveal>
      ))}
    </div>
  );
}

export default ProductGrid;
