import { Link } from 'react-router-dom'
import type { Product } from '../../types/catalog'
import { formatBdt } from '../../utils/formatCurrency'

type ProductCardProps = {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  const mainImage = [...product.images].sort((first, second) => first.position - second.position)[0]
  const discountPercentage = product.salePrice
    ? Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)
    : null

  return (
    <article className="group">
      <Link to={`/product/${product.slug}`} className="block overflow-hidden bg-blyver-ivory">
        <div className="relative aspect-square overflow-hidden bg-blyver-charcoal/10">
          {mainImage ? (
            <img src={mainImage.url} alt={mainImage.altText} className="size-full object-cover transition duration-700 group-hover:scale-105" />
          ) : (
            <div className="grid size-full place-items-center text-[10px] tracking-[0.18em] text-blyver-muted">IMAGE COMING SOON</div>
          )}
          {discountPercentage && <span className="absolute left-4 top-4 bg-blyver-ink px-3 py-2 text-[10px] tracking-[0.14em] text-blyver-ivory">{discountPercentage}% OFF</span>}
        </div>
      </Link>
      <div className="pt-5">
        <div className="flex items-start justify-between gap-4"><Link to={`/product/${product.slug}`} className="font-serif text-xl transition hover:text-blyver-champagne">{product.name}</Link><span className="text-blyver-muted" aria-label="Add to wishlist">♡</span></div>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-blyver-charcoal/65">{product.shortDescription}</p>
        <div className="mt-4 flex items-baseline gap-3"><span className="text-sm font-medium">{formatBdt(product.salePrice ?? product.originalPrice)}</span>{product.salePrice && <span className="text-xs text-blyver-muted line-through">{formatBdt(product.originalPrice)}</span>}</div>
        {product.averageRating && <p className="mt-3 text-xs tracking-[0.08em] text-blyver-charcoal/75">★ {product.averageRating.toFixed(1)} <span className="text-blyver-muted">({product.reviewCount})</span></p>}
      </div>
    </article>
  )
}

export default ProductCard
