import { supabase } from "../lib/supabase";
import {
  cartUpdatedEvent,
  notifyCartUpdated,
  type CartLine,
} from "./cartService";

// Cart for shoppers who are not signed in. It lives in this browser only.
// Prices and stock are always re-checked by the database when ordering.

const storageKey = "blyver:guest-cart";
export const guestCartMaxQuantity = 10;
export const guestCartMaxLines = 20;

export type GuestCartItem = { productId: string; quantity: number };

function readGuestCart(): GuestCartItem[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is GuestCartItem =>
        typeof item?.productId === "string" &&
        Number.isInteger(item?.quantity) &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCartItem[]) {
  try {
    if (items.length)
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    else window.localStorage.removeItem(storageKey);
  } catch {
    // Storage blocked (private mode etc.): the cart just won't persist.
  }
  notifyCartUpdated();
}

export function getGuestCart() {
  return readGuestCart();
}

export function getGuestCartCount() {
  return readGuestCart().reduce((total, item) => total + item.quantity, 0);
}

export function addGuestCartItem(productId: string, quantity = 1) {
  const items = readGuestCart();
  const existing = items.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity = Math.min(
      existing.quantity + quantity,
      guestCartMaxQuantity,
    );
  } else {
    if (items.length >= guestCartMaxLines)
      return {
        error: new Error(
          `Your bag can hold up to ${guestCartMaxLines} different pieces.`,
        ),
      };
    items.push({
      productId,
      quantity: Math.min(quantity, guestCartMaxQuantity),
    });
  }
  writeGuestCart(items);
  return { error: null };
}

export function setGuestCartQuantity(productId: string, quantity: number) {
  const items = readGuestCart()
    .map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(quantity, guestCartMaxQuantity) }
        : item,
    )
    .filter((item) => item.quantity > 0);
  writeGuestCart(items);
}

export function clearGuestCart() {
  writeGuestCart([]);
}

// Same shape as the signed-in cart, so CartPage can render both.
// For guest lines, `id` is the product id.
export async function getGuestCartLines(): Promise<CartLine[]> {
  const items = readGuestCart();
  if (!items.length) return [];
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, original_price, sale_price, stock_quantity, product_images(storage_path, alt_text, position)",
    )
    .in(
      "id",
      items.map((item) => item.productId),
    )
    .eq("status", "active");
  if (error) throw error;
  const products = new Map(
    (data ?? []).map((product) => [product.id, product]),
  );
  // Drop pieces that are no longer for sale.
  if (products.size !== items.length)
    writeGuestCart(items.filter((item) => products.has(item.productId)));
  return items
    .filter((item) => products.has(item.productId))
    .map((item) => ({
      id: item.productId,
      quantity: item.quantity,
      product: products.get(item.productId) as CartLine["product"],
    }));
}

// When a guest signs in, move their browser cart into their account cart.
export async function mergeGuestCartIntoAccount(userId: string) {
  const items = readGuestCart();
  if (!items.length) return;
  const { data: cart, error } = await supabase
    .from("carts")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("id")
    .single();
  if (error) throw error;
  for (const item of items) {
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cart.id)
      .eq("product_id", item.productId)
      .maybeSingle();
    // A piece that was removed from the shop simply fails here and is skipped.
    if (existing)
      await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + item.quantity })
        .eq("id", existing.id);
    else
      await supabase
        .from("cart_items")
        .insert({
          cart_id: cart.id,
          product_id: item.productId,
          quantity: item.quantity,
        });
  }
  clearGuestCart();
}

// For useSyncExternalStore: re-read when this tab or another tab changes the cart.
export function subscribeToGuestCart(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) onChange();
  };
  window.addEventListener(cartUpdatedEvent, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(cartUpdatedEvent, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
