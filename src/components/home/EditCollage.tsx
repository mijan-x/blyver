import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHomeProducts } from "../../services/catalogService";
import type { Product } from "../../types/catalog";

const tileCount = 4;

// Up to four different products that have a photo, alternating men's and
// women's pieces when both exist so the mosaic is a real mix.
function pickTiles(products: Product[]) {
  const withPhoto = products.filter((product) => product.images.length > 0);
  const men = withPhoto.filter((product) => product.gender === "men");
  const rest = withPhoto.filter((product) => product.gender !== "men");
  const picked: Product[] = [];
  for (let index = 0; picked.length < tileCount; index += 1) {
    const before = picked.length;
    if (men[index]) picked.push(men[index]);
    if (picked.length < tileCount && rest[index]) picked.push(rest[index]);
    if (picked.length === before) break;
  }
  return picked;
}

// A blend of real product photos from the live catalogue for "The Blyver
// Edit" section. Renders nothing until at least two photos are available.
function EditCollage() {
  const [tiles, setTiles] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    getHomeProducts()
      .then((products) => {
        if (active) setTiles(pickTiles(products));
      })
      .catch(() => {
        // Decorative section: stay empty if the catalogue can't load.
      });
    return () => {
      active = false;
    };
  }, []);

  if (tiles.length < 2) return null;

  return (
    <div className="mt-10 grid max-w-md grid-cols-2 gap-3 lg:mt-14">
      {tiles.map((product, index) => (
        <Link
          key={product.id}
          to={`/product/${product.slug}`}
          className={`group relative block aspect-[4/5] overflow-hidden bg-blyver-charcoal/10 ${
            index % 2 === 1 ? "mt-8" : ""
          }`}
        >
          <img
            src={product.images[0].url}
            alt={product.images[0].altText}
            width={400}
            height={500}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </Link>
      ))}
    </div>
  );
}

export default EditCollage;
