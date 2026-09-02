import { supabase } from '../lib/supabase'
export type Review = { id: string; rating: number; title: string; body: string; created_at: string; profiles: { full_name: string }[] | null }
export async function getProductReviews(productId: string) { const { data, error } = await supabase.from('reviews').select('id, rating, title, body, created_at, profiles(full_name)').eq('product_id', productId).eq('visible', true).order('created_at', { ascending: false }); if (error) throw error; return (data ?? []) as Review[] }
export async function createReview(productId: string, rating: number, title: string, body: string) { return supabase.from('reviews').insert({ product_id: productId, rating, title, body }) }
