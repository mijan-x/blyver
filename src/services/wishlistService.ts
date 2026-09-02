import { supabase } from '../lib/supabase'
import { getCatalogProducts } from './catalogService'
import type { Product } from '../types/catalog'
export const wishlistUpdatedEvent = 'blyver:wishlist-updated'
export function notifyWishlistUpdated() { window.dispatchEvent(new Event(wishlistUpdatedEvent)) }
export async function getWishlistProducts(userId: string): Promise<Product[]> { const { data, error } = await supabase.from('wishlists').select('product_id').eq('user_id', userId); if (error) throw error; const ids = (data ?? []).map((item) => item.product_id); if (!ids.length) return []; return (await getCatalogProducts()).filter((product) => ids.includes(product.id)) }
export async function getWishlistCount(userId: string) { const { count, error } = await supabase.from('wishlists').select('*', { count: 'exact', head: true }).eq('user_id', userId); if (error) throw error; return count ?? 0 }
export async function isWishlisted(userId: string, productId: string) { const { data, error } = await supabase.from('wishlists').select('product_id').eq('user_id', userId).eq('product_id', productId).maybeSingle(); if (error) throw error; return Boolean(data) }
export async function toggleWishlist(userId: string, productId: string, active: boolean) { const result = active ? await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId) : await supabase.from('wishlists').insert({ product_id: productId, user_id: userId }); if (!result.error) notifyWishlistUpdated(); return result }
