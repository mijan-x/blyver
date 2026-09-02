import { supabase } from '../lib/supabase'
import { notifyCartUpdated } from './cartService'
export type CheckoutAddress = { fullName: string; phone: string; division: string; district: string; area: string; fullAddress: string; email: string }
export async function createCodOrder(address: CheckoutAddress, couponCode: string) { const { data, error } = await supabase.rpc('create_cod_order', { coupon_code_input: couponCode || null, customer_address: { area: address.area, district: address.district, division: address.division, email: address.email, full_address: address.fullAddress, full_name: address.fullName, phone: address.phone } }); if (error) throw error; notifyCartUpdated(); return data as string }
