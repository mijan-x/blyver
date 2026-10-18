import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  m,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { getHomeProducts } from "../../services/catalogService";
import type { Product } from "../../types/catalog";
import { formatBdt } from "../../utils/formatCurrency";

const tileCount = 6;

// Up to six different products that have a photo, alternating men's and
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

function Tile({ product, delay }: { product: Product; delay: number }) {
  const reduceMotion = useReducedMotion();
  const link = useRef<HTMLAnchorElement>(null);
  const inView = useInView(link, { once: true, amount: 0.3 });
  const image = [...product.images].sort(
    (first, second) => first.position - second.position,
  )[0];
  const open = { clipPath: "inset(0% 0% 0% 0%)" };
  const closed = { clipPath: "inset(100% 0% 0% 0%)" };
  return (
    <Link ref={link} to={`/product/${product.slug}`} className="group block">
      <m.div
        initial={reduceMotion ? false : closed}
        animate={inView || reduceMotion ? open : closed}
        transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
        className="relative aspect-[4/5] overflow-hidden bg-blyver-polished"
      >
        <img
          src={image.url}
          alt={image.altText}
          width={400}
          height={500}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition duration-1000 group-hover:scale-105"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ring-1 ring-blyver-steel/20 ring-inset"
        />
      </m.div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <p className="truncate text-sm text-blyver-polished transition-colors group-hover:text-blyver-steel">
          {product.name}
        </p>
        <p className="shrink-0 text-xs tabular-nums text-blyver-steel/70">
          {formatBdt(product.salePrice ?? product.originalPrice)}
        </p>
      </div>
    </Link>
  );
}

// Real product photos from the live catalogue for "The Blyver Edit", in two
// columns that drift past each other at different speeds as you scroll.
// Renders nothing until at least two photos are available.
function EditCollage() {
  const [tiles, setTiles] = useState<Product[]>([]);
  const collage = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: collage,
    offset: ["start end", "end start"],
  });
  const leftY = useTransform(scrollYProgress, (value) =>
    reduceMotion ? 0 : 50 - value * 100,
  );
  const rightY = useTransform(scrollYProgress, (value) =>
    reduceMotion ? 0 : 140 - value * 280,
  );

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

  const left = tiles.filter((_, index) => index % 2 === 0);
  const right = tiles.filter((_, index) => index % 2 === 1);

  return (
    <div ref={collage} className="relative">
      {tiles.length >= 2 && (
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <m.div style={{ y: leftY }} className="grid content-start gap-8">
            {left.map((product, index) => (
              <Tile key={product.id} product={product} delay={index * 0.08} />
            ))}
          </m.div>
          <m.div style={{ y: rightY }} className="mt-24 grid content-start gap-8">
            {right.map((product, index) => (
              <Tile
                key={product.id}
                product={product}
                delay={0.12 + index * 0.08}
              />
            ))}
          </m.div>
        </div>
      )}
    </div>
  );
}

export default EditCollage;
