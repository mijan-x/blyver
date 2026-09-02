import { useEffect, useState } from 'react'
import ProductGrid from '../components/product/ProductGrid'
import { useAuth } from '../features/auth/useAuth'
import { getWishlistProducts } from '../services/wishlistService'
import type { Product } from '../types/catalog'
function WishlistPage() { const { user } = useAuth(); const [products, setProducts] = useState<Product[] | null>(null); useEffect(() => { if (user) getWishlistProducts(user.id).then(setProducts).catch(() => setProducts([])) }, [user]); return <main className="bg-blyver-ivory px-6 py-16 text-blyver-ink sm:px-10 sm:py-20"><div className="mx-auto max-w-7xl"><p className="text-[11px] tracking-[0.25em] text-blyver-champagne">YOUR WISHLIST</p><h1 className="mt-5 font-serif text-5xl sm:text-6xl">Pieces worth returning to.</h1><div className="mt-12">{products === null ? <p className="text-[11px] tracking-[0.18em] text-blyver-muted">LOADING WISHLIST</p> : products.length ? <ProductGrid products={products} /> : <p className="border border-blyver-ink/10 px-6 py-16 text-center text-sm text-blyver-charcoal/65">Your wishlist is currently empty.</p>}</div></div></main> }
export default WishlistPage
