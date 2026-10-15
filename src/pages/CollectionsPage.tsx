import brandCoverImage from "../assets/brand/landing-cover.webp";
import ladiesPursesImage from "../assets/collections/ladies-purses.webp";
import womensWatchesImage from "../assets/collections/womens-watches.webp";
import { Link } from "react-router-dom";

const collections = [
  {
    name: "Men's Watches",
    description: "Refined timepieces for every defining moment.",
    image: brandCoverImage,
    imageWidth: 1600,
    imageHeight: 667,
    imageAlt: "Blyver watch with gold accents",
    imagePosition: "object-[10%_center]",
    to: "/men",
  },
  {
    name: "Women’s Watches",
    description: "Elegant details, designed to be worn every day.",
    image: womensWatchesImage,
    imageWidth: 900,
    imageHeight: 1350,
    imageAlt: "Woman wearing a gold watch",
    imagePosition: "object-center",
    to: "/women",
  },
  {
    name: "Wallets",
    description: "Modern leather essentials with lasting character.",
    image: brandCoverImage,
    imageWidth: 1600,
    imageHeight: 667,
    imageAlt: "Blyver black leather wallet",
    imagePosition: "object-[94%_center]",
    to: "/men",
  },
  {
    name: "Ladies’ Purses",
    description: "Sophisticated companions for life in motion.",
    image: ladiesPursesImage,
    imageWidth: 900,
    imageHeight: 1200,
    imageAlt: "Teal leather purse with gold details",
    imagePosition: "object-center",
    to: "/women",
  },
];

function CollectionsPage() {
  return (
    <main className="min-h-screen bg-blyver-ink px-6 py-16 text-blyver-ivory sm:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs tracking-[0.28em] text-blyver-champagne">
          BLYVER COLLECTIONS
        </p>

        <h1 className="mt-5 max-w-2xl text-4xl font-light sm:text-6xl">
          Designed for every expression of elegance.
        </h1>

        <div className="mt-14 grid gap-px bg-blyver-muted/30 sm:grid-cols-2">
          {collections.map((collection) => (
            <Link
              key={collection.name}
              to={collection.to}
              className="group overflow-hidden bg-blyver-charcoal"
            >
              <div className="h-64 overflow-hidden bg-black sm:h-72">
                <img
                  src={collection.image}
                  alt={collection.imageAlt}
                  width={collection.imageWidth}
                  height={collection.imageHeight}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${collection.imagePosition}`}
                />
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
          ))}
        </div>
      </div>
    </main>
  );
}

export default CollectionsPage;
