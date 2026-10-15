import { useState } from "react";
import CatalogEmptyState from "../components/catalog/CatalogEmptyState";
import CatalogLoadingGrid from "../components/catalog/CatalogLoadingGrid";
import ProductGrid from "../components/product/ProductGrid";
import { useCatalogProducts } from "../hooks/useCatalogProducts";
import { useCategories } from "../hooks/useCategories";
import type { ProductGender } from "../types/catalog";

type CatalogPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  gender: ProductGender;
};

function CatalogPage({ eyebrow, title, description, gender }: CatalogPageProps) {
  const categories = useCategories(gender);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const { error, loading, products } = useCatalogProducts(gender, categoryId);

  return (
    <main className="bg-blyver-ivory px-6 py-14 text-blyver-ink sm:px-10 sm:py-18">
      <div className="mx-auto max-w-7xl">
        <p className="text-[11px] tracking-[0.26em] text-blyver-champagne">
          {eyebrow}
        </p>
        <div className="mt-5 grid gap-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <h1 className="max-w-3xl font-serif text-5xl leading-tight sm:text-7xl">
            {title}
          </h1>
          <p className="max-w-lg text-sm leading-7 text-blyver-charcoal/70">
            {description}
          </p>
        </div>
        {categories.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-y border-blyver-ink/10 py-5 text-[11px] tracking-[0.16em]">
            <button
              type="button"
              onClick={() => setCategoryId(undefined)}
              aria-pressed={categoryId === undefined}
              className={
                categoryId === undefined
                  ? "text-blyver-ink underline underline-offset-4"
                  : "text-blyver-charcoal/70 transition hover:text-blyver-ink"
              }
            >
              ALL
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                aria-pressed={categoryId === category.id}
                className={
                  categoryId === category.id
                    ? "text-blyver-ink underline underline-offset-4"
                    : "text-blyver-charcoal/70 transition hover:text-blyver-ink"
                }
              >
                {category.name.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        <div className="mt-12">
          {loading && <CatalogLoadingGrid />}
          {!loading && error && (
            <CatalogEmptyState
              title="We couldn’t load the catalogue."
              description="Please refresh the page. If the issue continues, check that your Supabase environment settings are present."
            />
          )}
          {!loading && !error && products.length === 0 && (
            <CatalogEmptyState
              title="The Blyver catalogue is being prepared."
              description="Products will appear here after product information, images, prices, and inventory are added securely in Supabase."
            />
          )}
          {!loading && !error && products.length > 0 && (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </main>
  );
}

export default CatalogPage;
