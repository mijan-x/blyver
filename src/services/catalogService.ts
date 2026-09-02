import { supabase } from '../lib/supabase'
import type { CatalogFilters, Product, ProductGender } from '../types/catalog'

type ProductRow = {
  id: string
  slug: string
  sku: string
  name: string
  short_description: string
  description: string
  gender: ProductGender
  category_id: string
  original_price: number | string
  sale_price: number | string | null
  stock_quantity: number
  low_stock_threshold: number
  featured: boolean
  new_arrival: boolean
  best_seller: boolean
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  product_images: Array<{ id: string; storage_path: string; alt_text: string; position: number }> | null
  product_variants: Array<{ id: string; sku: string; name: string; option_values: Record<string, string>; price_adjustment: number | string; stock_quantity: number; active: boolean }> | null
  product_specifications: Array<{ label: string; value: string; position: number }> | null
  product_collections: Array<{ collection_id: string }> | null
}

function toProduct(row: ProductRow): Product {
  const images = (row.product_images ?? []).map((image) => ({
    altText: image.alt_text || row.name,
    id: image.id,
    position: image.position,
    url: supabase.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl,
  }))

  return {
    averageRating: null,
    bestSeller: row.best_seller,
    categoryId: row.category_id,
    collectionIds: (row.product_collections ?? []).map((collection) => collection.collection_id),
    createdAt: row.created_at,
    description: row.description,
    featured: row.featured,
    gender: row.gender,
    id: row.id,
    images,
    lowStockThreshold: row.low_stock_threshold,
    name: row.name,
    newArrival: row.new_arrival,
    originalPrice: Number(row.original_price),
    reviewCount: 0,
    salePrice: row.sale_price === null ? null : Number(row.sale_price),
    shortDescription: row.short_description,
    sku: row.sku,
    slug: row.slug,
    specifications: (row.product_specifications ?? []).map((specification) => ({
      label: specification.label,
      position: specification.position,
      value: specification.value,
    })),
    status: row.status,
    stockQuantity: row.stock_quantity,
    updatedAt: row.updated_at,
    variants: (row.product_variants ?? []).map((variant) => ({
      active: variant.active,
      id: variant.id,
      name: variant.name,
      optionValues: variant.option_values,
      priceAdjustment: Number(variant.price_adjustment),
      sku: variant.sku,
      stockQuantity: variant.stock_quantity,
    })),
  }
}

const productSelect = 'id, slug, sku, name, short_description, description, gender, category_id, original_price, sale_price, stock_quantity, low_stock_threshold, featured, new_arrival, best_seller, status, created_at, updated_at, product_images(id, storage_path, alt_text, position), product_variants(id, sku, name, option_values, price_adjustment, stock_quantity, active), product_specifications(label, value, position), product_collections(collection_id)'

export async function getCatalogProducts(filters: CatalogFilters = {}): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(productSelect)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters.gender) query = query.eq('gender', filters.gender)
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.inStockOnly) query = query.gt('stock_quantity', 0)
  if (filters.onSaleOnly) query = query.not('sale_price', 'is', null)
  if (filters.query) query = query.ilike('name', `%${filters.query}%`)

  const { data, error } = await query

  if (error) throw error

  return ((data ?? []) as ProductRow[]).map(toProduct)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(productSelect).eq('slug', slug).eq('status', 'active').maybeSingle()
  if (error) throw error
  return data ? toProduct(data as ProductRow) : null
}
