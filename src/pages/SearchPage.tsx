import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import CatalogEmptyState from "../components/catalog/CatalogEmptyState";
import CatalogLoadingGrid from "../components/catalog/CatalogLoadingGrid";
import ProductGrid from "../components/product/ProductGrid";
import Seo from "../components/seo/Seo";
import { getCatalogProducts } from "../services/catalogService";
import type { Product } from "../types/catalog";

type SearchResult = { error: boolean; products: Product[]; query: string };

function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const [result, setResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    if (!query) return;
    let active = true;
    getCatalogProducts({ query })
      .then((products) => {
        if (active) setResult({ error: false, products, query });
      })
      .catch(() => {
        if (active) setResult({ error: true, products: [], query });
      });
    return () => {
      active = false;
    };
  }, [query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(
      new FormData(event.currentTarget).get("q") ?? "",
    ).trim();
    setParams(value ? { q: value } : {});
  }

  // Results belong to the query they were fetched for; anything else means
  // the current query is still loading.
  const loading = query !== "" && result?.query !== query;
  const current = result?.query === query ? result : null;

  return (
    <main className="bg-blyver-ivory px-6 py-14 text-blyver-ink sm:px-10 sm:py-18">
      <Seo
        title={query ? `Search: ${query} | Blyver` : "Search | Blyver"}
        description="Search Blyver's watches, wallets and purses."
      />
      <div className="mx-auto max-w-7xl">
        <p className="text-[11px] tracking-[0.26em] text-blyver-champagne">
          SEARCH
        </p>
        <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-tight sm:text-7xl">
          Find your next everyday essential.
        </h1>
        <form
          onSubmit={submit}
          role="search"
          className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="search-query">
            Search products
          </label>
          <input
            key={query}
            id="search-query"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={100}
            autoComplete="off"
            placeholder="Search by product name"
            className="w-full border border-blyver-ink/20 bg-transparent px-4 py-3 outline-none focus:border-blyver-champagne"
          />
          <button className="bg-blyver-ink px-7 py-3 text-[11px] tracking-[0.16em] text-blyver-ivory">
            SEARCH
          </button>
        </form>
        <div className="mt-12">
          {query === "" && (
            <p className="text-sm text-blyver-charcoal/70">
              Type a product name to search the catalogue.
            </p>
          )}
          {loading && <CatalogLoadingGrid />}
          {current?.error && (
            <CatalogEmptyState
              title="We couldn’t run that search."
              description="Please try again in a moment."
            />
          )}
          {current && !current.error && current.products.length === 0 && (
            <CatalogEmptyState
              title={`No results for “${query}”.`}
              description="Check the spelling or try a shorter word, such as “watch” or “purse”."
            />
          )}
          {current && !current.error && current.products.length > 0 && (
            <>
              <p className="mb-8 text-[11px] tracking-[0.16em] text-blyver-charcoal/70">
                {current.products.length} RESULT
                {current.products.length === 1 ? "" : "S"} FOR “
                {query.toUpperCase()}”
              </p>
              <ProductGrid products={current.products} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default SearchPage;
