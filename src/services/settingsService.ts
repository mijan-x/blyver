import { supabase } from '../lib/supabase'
export type StoreSettings = { currency: string; delivery_charge: number; free_delivery_threshold: number | null; phone: string; email: string; whatsapp: string; business_address: string }
export const defaultStoreSettings: StoreSettings = { business_address: '', currency: 'BDT', delivery_charge: 80, email: '', free_delivery_threshold: null, phone: '', whatsapp: '' }
export async function getStoreSettings() { const { data, error } = await supabase.from('site_settings').select('currency, delivery_charge, free_delivery_threshold, phone, email, whatsapp, business_address').eq('id', true).maybeSingle(); if (error) throw error; return { ...defaultStoreSettings, ...(data ?? {}) } }
export async function saveStoreSettings(settings: StoreSettings) { return supabase.from('site_settings').upsert({ id: true, ...settings }, { onConflict: 'id' }) }
