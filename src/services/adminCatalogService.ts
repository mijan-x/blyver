import { supabase } from "../lib/supabase";
import type { ProductGender, ProductStatus } from "../types/catalog";

export const MAX_PRODUCT_IMAGES = 9;

export type AdminCategory = {
  id: string;
  name: string;
  gender: ProductGender | null;
};
export type AdminProductImage = {
  id: string;
  storage_path: string;
  alt_text: string;
  position: number;
};
export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  gender: ProductGender;
  short_description: string;
  description: string;
  original_price: number;
  sale_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  featured: boolean;
  new_arrival: boolean;
  best_seller: boolean;
  status: ProductStatus;
  product_images: AdminProductImage[] | null;
};
export type ProductInput = Omit<AdminProduct, "id" | "slug" | "product_images">;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getAdminCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, gender")
    .order("name");
  if (error) throw error;
  return (data ?? []) as AdminCategory[];
}
export async function createAdminCategory(name: string, gender: ProductGender) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, gender, slug: slugify(name), active: true })
    .select("id, name, gender")
    .single();
  if (error) throw error;
  return data as AdminCategory;
}
export async function getAdminProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, sku, category_id, gender, short_description, description, original_price, sale_price, stock_quantity, low_stock_threshold, featured, new_arrival, best_seller, status, product_images(id, storage_path, alt_text, position)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AdminProduct[]).map((product) => ({
    ...product,
    original_price: Number(product.original_price),
    sale_price: product.sale_price === null ? null : Number(product.sale_price),
  }));
}
export async function saveAdminProduct(input: ProductInput, id?: string) {
  const payload = {
    ...input,
    slug: slugify(input.name),
    sale_price: input.sale_price || null,
  };
  const response = id
    ? await supabase
        .from("products")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("products").insert(payload).select("id").single();
  if (response.error) throw response.error;
  return response.data.id as string;
}
// order_items keeps its own snapshot of everything a past order needs to
// display (product_name, sku, unit_price, quantity, line_total), so it
// never has to look the product back up -- deleting a product that has
// been ordered doesn't break any order history. order_items.product_id is
// ON DELETE SET NULL, so the delete below detaches those rows instead of
// being blocked by the foreign key.
export async function deleteAdminProduct(
  product: AdminProduct,
): Promise<{ archived: boolean }> {
  const images = product.product_images ?? [];
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", product.id);
  if (error) {
    // Safety net for any foreign key this doesn't know about yet: archive
    // (hide from the store) instead of surfacing a raw database error.
    if (error.code === "23503") {
      const { error: archiveError } = await supabase
        .from("products")
        .update({ status: "inactive" })
        .eq("id", product.id);
      if (archiveError) throw archiveError;
      return { archived: true };
    }
    throw error;
  }
  if (images.length)
    await supabase.storage
      .from("product-images")
      .remove(images.map((image) => image.storage_path));
  return { archived: false };
}
// A product can have 1-9 images (product_images.position is unique per
// product, 0-based). This uploads one or more files into the next free
// position slots, leaving any existing images untouched.
export async function uploadAdminProductImages(
  productId: string,
  productName: string,
  files: File[],
) {
  if (!files.length) return;
  const { data: existingRows, error: existingError } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId);
  if (existingError) throw existingError;
  const usedPositions = new Set(
    (existingRows ?? []).map((row) => row.position),
  );
  const availableSlots = MAX_PRODUCT_IMAGES - usedPositions.size;
  if (files.length > availableSlots) {
    throw new Error(
      availableSlots <= 0
        ? `This product already has the maximum of ${MAX_PRODUCT_IMAGES} images. Remove one before adding another.`
        : `Only ${availableSlots} more image${availableSlots === 1 ? "" : "s"} can be added (max ${MAX_PRODUCT_IMAGES} per product).`,
    );
  }
  let nextPosition = 0;
  for (const file of files) {
    while (usedPositions.has(nextPosition)) nextPosition += 1;
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `products/${slugify(productName)}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;
    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: productId,
      storage_path: path,
      alt_text: productName,
      position: nextPosition,
    });
    if (imageError) {
      // Don't leave an orphaned file in storage if the DB insert failed.
      await supabase.storage.from("product-images").remove([path]);
      throw imageError;
    }
    usedPositions.add(nextPosition);
  }
}
// A product needs at least one image, so this refuses to remove the last
// one -- the admin has to add a replacement first.
export async function removeAdminProductImage(
  productId: string,
  image: AdminProductImage,
) {
  const { count, error: countError } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if (countError) throw countError;
  if ((count ?? 0) <= 1)
    throw new Error(
      "A product needs at least one image -- add a replacement before removing this one.",
    );
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", image.id);
  if (error) throw error;
  await supabase.storage.from("product-images").remove([image.storage_path]);
}
