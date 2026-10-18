import { useEffect, useState } from "react";
import { getHomeProducts } from "../../services/catalogService";
import type { Product } from "../../types/catalog";
import coverImage from "../../assets/brand/landing-cover.webp";

// Real men's product photos for the "For him" tile: up to two different
// watches side by side, featured pieces first. Falls back to the brand cover
// image if the catalogue has no men's photos or can't be loaded.
function pickMenProducts(products: Product[]) {
  const men = products.filter(
    (product) => product.gender === "men" && product.images.length > 0,
  );
  const ordered = [
    ...men.filter((product) => product.featured),
    ...men.filter((product) => !product.featured),
  ];
  return ordered.slice(0, 2);
}

function MenTileImage() {
  // null = still loading; [] = nothing to show, use the cover image.
  const [tiles, setTiles] = useState<Product[] | null>(null);

  useEffect(() => {
    let active = true;
    getHomeProducts()
      .then((products) => {
        if (active) setTiles(pickMenProducts(products));
      })
      .catch(() => {
        if (active) setTiles([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (tiles === null) return null;

  if (tiles.length === 0)
    return (
      <img
        src={coverImage}
        alt="Blyver men's watches and wallets"
        width={1600}
        height={667}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[20%_center] transition duration-700 group-hover:scale-105"
      />
    );

  return (
    <div className="absolute inset-0 flex transition duration-700 group-hover:scale-105">
      {tiles.map((product) => (
        <img
          key={product.id}
          src={product.images[0].url}
          alt={product.images[0].altText}
          width={600}
          height={900}
          loading="lazy"
          decoding="async"
          className="h-full min-w-0 flex-1 object-cover"
        />
      ))}
    </div>
  );
}

export default MenTileImage;
