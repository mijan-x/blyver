import type { Product } from '../../types/catalog'
import ProductCard from './ProductCard'

type ProductGridProps = {
  products: Product[]
}

function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  )
}

export default ProductGrid
