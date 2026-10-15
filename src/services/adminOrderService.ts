import { supabase } from "../lib/supabase";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

// Keep in sync with admin_update_order_status() in the database
// (supabase/migrations/20261016120000_admin_orders.sql).
export const orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  cancelled: [],
  confirmed: ["processing", "cancelled"],
  delivered: ["returned"],
  out_for_delivery: ["delivered", "returned"],
  pending: ["confirmed", "cancelled"],
  processing: ["shipped", "cancelled"],
  returned: [],
  shipped: ["out_for_delivery", "delivered", "returned"],
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  cancelled: "Cancelled",
  confirmed: "Confirmed",
  delivered: "Delivered",
  out_for_delivery: "Out for delivery",
  pending: "Pending",
  processing: "Processing",
  returned: "Returned",
  shipped: "Shipped",
};

export type CustomerAddress = {
  full_name: string;
  phone: string;
  email?: string;
  division: string;
  district: string;
  area: string;
  full_address: string;
};

export type AdminOrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type AdminOrder = {
  id: string;
  order_number: string;
  status: OrderStatus;
  is_guest: boolean;
  guest_phone: string | null;
  customer_email: string | null;
  customer_address: CustomerAddress;
  subtotal: number;
  delivery_charge: number;
  coupon_code: string | null;
  coupon_discount: number;
  total: number;
  created_at: string;
  stock_restored_at: string | null;
  items: AdminOrderItem[];
};

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  user_id: string | null;
  guest_phone: string | null;
  customer_address: CustomerAddress;
  subtotal: number | string;
  delivery_charge: number | string;
  coupon_code: string | null;
  coupon_discount: number | string;
  total: number | string;
  created_at: string;
  stock_restored_at: string | null;
  order_items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    sku: string;
    unit_price: number | string;
    quantity: number;
    line_total: number | string;
  }> | null;
};

const adminOrderSelect =
  "id, order_number, status, user_id, guest_phone, customer_address, subtotal, delivery_charge, coupon_code, coupon_discount, total, created_at, stock_restored_at, order_items(id, product_id, product_name, sku, unit_price, quantity, line_total)";

function toAdminOrder(row: OrderRow): AdminOrder {
  return {
    coupon_code: row.coupon_code,
    coupon_discount: Number(row.coupon_discount),
    created_at: row.created_at,
    customer_address: row.customer_address,
    customer_email: row.customer_address?.email || null,
    delivery_charge: Number(row.delivery_charge),
    guest_phone: row.guest_phone,
    id: row.id,
    is_guest: row.user_id === null,
    items: (row.order_items ?? [])
      .map((item) => ({
        id: item.id,
        line_total: Number(item.line_total),
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        sku: item.sku,
        unit_price: Number(item.unit_price),
      }))
      .sort((first, second) =>
        first.product_name.localeCompare(second.product_name),
      ),
    order_number: row.order_number,
    status: row.status,
    stock_restored_at: row.stock_restored_at,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
  };
}

export type AdminOrderFilters = {
  status?: OrderStatus;
  search?: string;
};

// Admins can read every order (RLS policy "Admins can view all orders"); the
// RLS policy restricts non-admins to their own orders only.
export async function getAdminOrders(
  filters: AdminOrderFilters = {},
): Promise<AdminOrder[]> {
  let query = supabase
    .from("orders")
    .select(adminOrderSelect)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;

  let orders = ((data ?? []) as unknown as OrderRow[]).map(toAdminOrder);

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    orders = orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(search) ||
        order.customer_address?.full_name?.toLowerCase().includes(search) ||
        (order.guest_phone ?? order.customer_address?.phone ?? "")
          .toLowerCase()
          .includes(search),
    );
  }

  return orders;
}

// The only way to change an order's status. The database function
// (admin_update_order_status) checks the admin role itself, validates the
// transition, and restores stock exactly once for cancelled/returned.
// It returns the plain orders row (no items), so callers should reload
// their order list afterwards rather than trust this return value for items.
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
) {
  const { error } = await supabase.rpc("admin_update_order_status", {
    new_status: newStatus,
    order_id: orderId,
  });
  if (error) throw error;
}
