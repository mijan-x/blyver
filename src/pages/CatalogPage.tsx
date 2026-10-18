import { useState } from "react";
import CatalogEmptyState from "../components/catalog/CatalogEmptyState";
import CatalogLoadingGrid from "../components/catalog/CatalogLoadingGrid";
import ProductGrid from "../components/product/ProductGrid";
import { useCatalogProducts } from "../hooks/useCatalogProducts";
import { useCategories } from "../hooks/useCategories";
import type { ProductGender } from "../types/catalog";
import MaskReveal from "../components/motion/MaskReveal";
import Reveal from "../components/motion/Reveal";

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
    <main className="brushed-light px-6 py-14 text-blyver-ink sm:px-10 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="type-wide text-[10px] text-blyver-blued-deep">
            {eyebrow}
          </p>
        </Reveal>
        <div className="mt-5 grid gap-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <MaskReveal className="max-w-3xl">
            <h1 className="font-serif text-4xl leading-[1.04] sm:text-6xl">
              {title}
            </h1>
          </MaskReveal>
          <Reveal delay={0.15}>
            <p className="max-w-lg text-sm leading-7 text-blyver-charcoal/70">
              {description}
            </p>
          </Reveal>
        </div>
        {categories.length > 0 && (
          <div className="type-wide mt-12 flex flex-wrap gap-x-7 gap-y-3 border-y border-blyver-ink/10 py-5 text-[10px]">
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
