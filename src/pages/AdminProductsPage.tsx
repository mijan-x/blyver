import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createAdminCategory,
  deleteAdminProduct,
  getAdminCategories,
  getAdminProducts,
  MAX_PRODUCT_IMAGES,
  removeAdminProductImage,
  saveAdminProduct,
  uploadAdminProductImages,
  type AdminCategory,
  type AdminProduct,
  type AdminProductImage,
  type ProductInput,
} from "../services/adminCatalogService";
import type { ProductGender } from "../types/catalog";
import { formatBdt } from "../utils/formatCurrency";
import { supabase } from "../lib/supabase";
import AdminToast from "../components/admin/AdminToast";
import { useAdminToast } from "../hooks/useAdminToast";

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function imageUrl(path: string | null | undefined) {
  return path
    ? supabase.storage.from("product-images").getPublicUrl(path).data
        .publicUrl
    : null;
}

const emptyProduct = (categoryId = ""): ProductInput => ({
  name: "",
  sku: "",
  category_id: categoryId,
  gender: "men",
  short_description: "",
  description: "",
  original_price: 0,
  sale_price: null,
  stock_quantity: 0,
  low_stock_threshold: 3,
  featured: false,
  new_arrival: false,
  best_seller: false,
  status: "active",
});
function AdminProductsPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyProduct());
  const [images, setImages] = useState<File[]>([]);
  const { toast, notifySuccess, notifyError, dismiss } = useAdminToast();
  const [newCategory, setNewCategory] = useState("");
  const existingImages = useMemo(
    () =>
      [...(editing?.product_images ?? [])].sort(
        (a, b) => a.position - b.position,
      ),
    [editing],
  );
  const imagePreviews = useMemo(
    () => images.map((file) => URL.createObjectURL(file)),
    [images],
  );
  useEffect(() => {
    return () => imagePreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [imagePreviews]);
  const load = useCallback(
    () =>
      Promise.all([getAdminCategories(), getAdminProducts()])
        .then(([loadedCategories, loadedProducts]) => {
          setCategories(loadedCategories);
          setProducts(loadedProducts);
          setForm((current) =>
            current.category_id || !loadedCategories[0]
              ? current
              : { ...current, category_id: loadedCategories[0].id },
          );
          return loadedProducts;
        })
        .catch((error: Error) => {
          notifyError(error.message);
          return undefined;
        }),
    [notifyError],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const change = <K extends keyof ProductInput>(
    key: K,
    value: ProductInput[K],
  ) => setForm((current) => ({ ...current, [key]: value }));
  function startNew() {
    setEditing(null);
    setImages([]);
    setForm(emptyProduct(categories[0]?.id));
    scrollToTop();
  }
  function startEdit(product: AdminProduct) {
    setEditing(product);
    setImages([]);
    setForm({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      gender: product.gender,
      short_description: product.short_description,
      description: product.description,
      original_price: product.original_price,
      sale_price: product.sale_price,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      featured: product.featured,
      new_arrival: product.new_arrival,
      best_seller: product.best_seller,
      status: product.status,
    });
    // The product list this is called from can be far below the form
    // (the two sit side by side only on wide screens); scroll up so the
    // admin actually sees the form populate with the product's data.
    scrollToTop();
  }
  function handleImagesSelected(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) {
      setImages([]);
      return;
    }
    const allowed = MAX_PRODUCT_IMAGES - existingImages.length;
    if (files.length > allowed) {
      notifyError(
        allowed <= 0
          ? `This product already has the maximum of ${MAX_PRODUCT_IMAGES} images — remove one first.`
          : `Only the first ${allowed} image${allowed === 1 ? "" : "s"} were kept (max ${MAX_PRODUCT_IMAGES} per product).`,
      );
    }
    setImages(files.slice(0, Math.max(allowed, 0)));
  }
  async function removeExistingImage(productImage: AdminProductImage) {
    if (!editing) return;
    if (!window.confirm("Remove this image?")) return;
    try {
      await removeAdminProductImage(editing.id, productImage);
      const reloaded = await load();
      const updated = reloaded?.find((product) => product.id === editing.id);
      if (updated) setEditing(updated);
      notifySuccess("Image removed.");
    } catch (error) {
      notifyError(
        error instanceof Error ? error.message : "Image could not be removed.",
      );
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isNewProduct = !editing;
    if (
      isNewProduct &&
      !images.length &&
      !window.confirm(
        "No images selected — add this product without photos? You can attach some afterwards; this product will keep editing open so you can add them right away.",
      )
    )
      return;
    try {
      const id = await saveAdminProduct(form, editing?.id);
      if (images.length) await uploadAdminProductImages(id, form.name, images);
      const reloaded = await load();
      // Only stay on the product (instead of resetting to a blank form) when
      // it was just created with no image yet -- that's the one case where
      // the admin still needs this exact product's upload control in front
      // of them. Once it has at least one image, go back to a blank form so
      // adding the next product doesn't require clicking Cancel first.
      if (isNewProduct && !images.length) {
        const created = reloaded?.find((product) => product.id === id);
        if (created) {
          startEdit(created);
          notifySuccess(
            "Product added — attach an image below whenever you're ready.",
          );
          return;
        }
      }
      notifySuccess(editing ? "Product updated." : "Product added.");
      startNew();
    } catch (error) {
      notifyError(
        error instanceof Error ? error.message : "Product could not be saved.",
      );
    }
  }
  async function addCategory() {
    if (!newCategory.trim()) return;
    try {
      const category = await createAdminCategory(
        newCategory.trim(),
        form.gender,
      );
      setCategories((current) =>
        [...current, category].sort((a, b) => a.name.localeCompare(b.name)),
      );
      change("category_id", category.id);
      setNewCategory("");
      notifySuccess("Category added.");
    } catch (error) {
      notifyError(
        error instanceof Error ? error.message : "Category could not be added.",
      );
    }
  }
  async function remove(product: AdminProduct) {
    if (!window.confirm(`Remove ${product.name}? This cannot be undone.`))
      return;
    try {
      const result = await deleteAdminProduct(product);
      notifySuccess(
        result.archived
          ? `${product.name} couldn't be fully deleted, so it was hidden from the store instead. Set Visibility back to Visible if you need to unhide it.`
          : "Product removed.",
      );
      await load();
    } catch (error) {
      notifyError(
        error instanceof Error
          ? error.message
          : "Product could not be removed.",
      );
    }
  }
  return (
    <main className="bg-blyver-ivory px-6 py-16 text-blyver-ink sm:px-10 sm:py-20">
      <AdminToast toast={toast} onDismiss={dismiss} />
      <div className="mx-auto grid max-w-7xl gap-14 xl:grid-cols-[420px_1fr]">
        <section>
          <p className="text-[11px] tracking-[0.24em] text-blyver-champagne">
            BLYVER ADMIN / PRODUCTS
          </p>
          <h1 className="mt-5 font-serif text-5xl">
            {editing ? "Edit product." : "Add a product."}
          </h1>
          <p className="mt-4 text-sm leading-7 text-blyver-charcoal/65">
            Publish products, change inventory and prices, or upload a
            replacement image here.
          </p>
          <form onSubmit={submit} className="mt-9 space-y-4">
            <label className="block text-sm">
              Product name
              <input
                required
                value={form.name}
                onChange={(event) => change("name", event.target.value)}
                className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                SKU
                <input
                  required
                  value={form.sku}
                  onChange={(event) => change("sku", event.target.value)}
                  className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
                />
              </label>
              <label className="text-sm">
                For
                <select
                  value={form.gender}
                  onChange={(event) =>
                    change("gender", event.target.value as ProductGender)
                  }
                  className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                </select>
              </label>
            </div>
            <label className="block text-sm">
              Category
              <select
                required
                value={form.category_id}
                onChange={(event) => change("category_id", event.target.value)}
                className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="New category name"
                className="min-w-0 flex-1 border border-blyver-ink/20 bg-transparent px-3 py-3 text-sm"
              />
              <button
                type="button"
                onClick={addCategory}
                className="border border-blyver-ink px-3 text-[10px] tracking-[0.12em]"
              >
                ADD
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                Original price
                <input
                  required
                  min="0"
                  type="number"
                  value={form.original_price}
                  onFocus={(event) => event.target.select()}
                  onChange={(event) =>
                    change("original_price", Number(event.target.value))
                  }
                  className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
                />
              </label>
              <label className="text-sm">
                Sale price
                <input
                  min="0"
                  type="number"
                  value={form.sale_price ?? ""}
                  onFocus={(event) => event.target.select()}
                  onChange={(event) =>
                    change(
                      "sale_price",
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                  className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                Stock
                <input
                  required
                  min="0"
                  type="number"
                  value={form.stock_quantity}
                  onFocus={(event) => event.target.select()}
                  onChange={(event) =>
                    change("stock_quantity", Number(event.target.value))
                  }
                  className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
                />
              </label>
              <label className="text-sm">
                Visibility
                <select
                  value={form.status}
                  onChange={(event) =>
                    change(
                      "status",
                      event.target.value as ProductInput["status"],
                    )
                  }
                  className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
                >
                  <option value="active">Visible</option>
                  <option value="inactive">Hidden</option>
                </select>
              </label>
            </div>
            <label className="block text-sm">
              Short description
              <textarea
                required
                rows={2}
                value={form.short_description}
                onChange={(event) =>
                  change("short_description", event.target.value)
                }
                className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
              />
            </label>
            <label className="block text-sm">
              Full description
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => change("description", event.target.value)}
                className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
              />
            </label>
            <label className="block text-sm">
              Product images (1-{MAX_PRODUCT_IMAGES})
              <input
                accept="image/*"
                type="file"
                multiple
                onChange={(event) =>
                  handleImagesSelected(event.target.files)
                }
                className="mt-2 block w-full text-sm"
              />
            </label>
            {images.length > 0 && (
              <div>
                <p className="text-xs text-blyver-charcoal/70">
                  {images.length} new image{images.length > 1 ? "s" : ""}{" "}
                  selected — will upload when you save.
                </p>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {imagePreviews.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
            {existingImages.length > 0 && (
              <div>
                <p className="text-xs text-blyver-charcoal/70">
                  Current images ({existingImages.length}/
                  {MAX_PRODUCT_IMAGES}). At least one must remain.
                </p>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {existingImages.map((productImage) => (
                    <div key={productImage.id} className="relative">
                      <img
                        src={
                          imageUrl(productImage.storage_path) ?? undefined
                        }
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(productImage)}
                        disabled={existingImages.length <= 1}
                        title={
                          existingImages.length <= 1
                            ? "A product needs at least one image"
                            : "Remove this image"
                        }
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-blyver-ink text-[10px] text-blyver-ivory disabled:opacity-30"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <label>
                <input
                  checked={form.featured}
                  onChange={(event) => change("featured", event.target.checked)}
                  type="checkbox"
                />{" "}
                Featured
              </label>
              <label>
                <input
                  checked={form.new_arrival}
                  onChange={(event) =>
                    change("new_arrival", event.target.checked)
                  }
                  type="checkbox"
                />{" "}
                New arrival
              </label>
              <label>
                <input
                  checked={form.best_seller}
                  onChange={(event) =>
                    change("best_seller", event.target.checked)
                  }
                  type="checkbox"
                />{" "}
                Best seller
              </label>
            </div>
            <div className="flex gap-4">
              <button className="bg-blyver-ink px-5 py-4 text-[11px] tracking-[0.15em] text-blyver-ivory">
                {editing ? "SAVE CHANGES" : "ADD PRODUCT"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={startNew}
                  className="border border-blyver-ink/25 px-5 py-4 text-[11px] tracking-[0.15em]"
                >
                  CANCEL
                </button>
              )}
            </div>
          </form>
        </section>
        <section>
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-blyver-champagne">
                INVENTORY
              </p>
              <h2 className="mt-3 font-serif text-4xl">All products.</h2>
            </div>
            <button
              type="button"
              onClick={startNew}
              className="text-[11px] tracking-[0.14em] underline"
            >
              NEW PRODUCT
            </button>
          </div>
          <div className="mt-8 divide-y divide-blyver-ink/10 border-y border-blyver-ink/10">
            {products.map((product) => (
              <article
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div>
                  <p className="font-serif text-xl">{product.name}</p>
                  <p className="mt-1 text-xs text-blyver-muted">
                    {product.sku} · {product.stock_quantity} in stock ·{" "}
                    {product.status}
                  </p>
                  <p className="mt-2 text-sm">
                    {formatBdt(product.sale_price ?? product.original_price)}
                  </p>
                </div>
                <div className="flex gap-4 text-[11px] tracking-[0.13em]">
                  <button
                    onClick={() => startEdit(product)}
                    className="underline"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => remove(product)}
                    className="text-red-800 underline"
                  >
                    REMOVE
                  </button>
                </div>
              </article>
            ))}
            {!products.length && (
              <p className="py-10 text-sm text-blyver-muted">
                No products yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
export default AdminProductsPage;
