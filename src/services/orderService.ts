import { supabase } from '../lib/supabase'
export type OrderSummary = { id: string; order_number: string; status: string; total: number; created_at: string }
export async function getOrders() { const { data, error } = await supabase.from('orders').select('id, order_number, status, total, created_at').order('created_at', { ascending: false }); if (error) throw error; return (data ?? []) as OrderSummary[] }
