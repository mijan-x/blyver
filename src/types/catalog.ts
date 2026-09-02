export type ProductGender = 'men' | 'women' | 'unisex'

export type ProductStatus = 'active' | 'inactive'

export type ProductSort =
  | 'featured'
  | 'newest'
  | 'price-low-to-high'
  | 'price-high-to-low'
  | 'best-selling'
  | 'highest-rated'
  | 'biggest-discount'

export type ProductImage = {
  id: string
  url: string
  altText: string
  position: number
}

export type ProductVariant = {
  id: string
  sku: string
  name: string
  optionValues: Record<string, string>
  priceAdjustment: number
  stockQuantity: number
  active: boolean
}

export type ProductSpecification = {
  label: string
  value: string
  position: number
}

export type Product = {
  id: string
  slug: string
  sku: string
  name: string
  shortDescription: string
  description: string
  gender: ProductGender
  categoryId: string
  collectionIds: string[]
  originalPrice: number
  salePrice: number | null
  stockQuantity: number
  lowStockThreshold: number
  averageRating: number | null
  reviewCount: number
  featured: boolean
  newArrival: boolean
  bestSeller: boolean
  status: ProductStatus
  images: ProductImage[]
  variants: ProductVariant[]
  specifications: ProductSpecification[]
  createdAt: string
  updatedAt: string
}

export type CatalogFilters = {
  categoryId?: string
  collectionId?: string
  gender?: ProductGender
  minPrice?: number
  maxPrice?: number
  inStockOnly?: boolean
  onSaleOnly?: boolean
  minimumRating?: number
  query?: string
  sort?: ProductSort
}
