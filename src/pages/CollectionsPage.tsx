import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import brandCoverImage from "../assets/brand/landing-cover.webp";
import ladiesPursesImage from "../assets/collections/ladies-purses.webp";
import womensWatchesImage from "../assets/collections/womens-watches.webp";
import { getCollections } from "../services/catalogService";
import type { Collection } from "../types/catalog";

// Fallback images for the collections that shipped with the store, so the
// page still looks right before an admin uploads a feature image for them
// from /admin/collections. A collection with no image here and none
// uploaded yet simply shows no image -- nothing to fall back to for one an
// admin created from scratch.
const fallbackImagesBySlug: Record<string, string> = {
  "ladies-purses": ladiesPursesImage,
  "mens-watches": brandCoverImage,
  wallets: brandCoverImage,
  "womens-watches": womensWatchesImage,
};

function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCollections()
      .then((result) => {
        setCollections(result);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-blyver-ink px-6 py-16 text-blyver-ivory sm:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs tracking-[0.28em] text-blyver-champagne">
          BLYVER COLLECTIONS
        </p>

        <h1 className="mt-5 max-w-2xl text-4xl font-light sm:text-6xl">
          Designed for every expression of elegance.
        </h1>

        {!loading && !error && collections.length === 0 && (
          <p className="mt-14 text-sm text-blyver-muted">
            Collections are being prepared.
          </p>
        )}
        {error && (
          <p className="mt-14 text-sm text-blyver-muted">
            We couldn’t load the collections. Please refresh the page.
          </p>
        )}

        {collections.length > 0 && (
          <div className="mt-14 grid gap-px bg-blyver-muted/30 sm:grid-cols-2">
            {collections.map((collection) => {
              const image =
                collection.imageUrl ?? fallbackImagesBySlug[collection.slug];
              return (
                <Link
                  key={collection.id}
                  to={collection.linkPath || "/collections"}
                  className="group overflow-hidden bg-blyver-charcoal"
                >
                  <div className="h-64 overflow-hidden bg-black sm:h-72">
                    {image && (
                      <img
                        src={image}
                        alt={collection.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-8 sm:p-10">
                    <h2 className="text-2xl font-light">{collection.name}</h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-blyver-muted">
                      {collection.description}
                    </p>
                    <span className="mt-8 inline-block text-xs tracking-[0.18em] text-blyver-champagne">
                      DISCOVER
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default CollectionsPage;
