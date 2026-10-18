import { lazy, Suspense, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  m,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import type { HomepageContent } from "../../../services/contentService";
import Parallax from "../../motion/Parallax";
import coverImage from "../../../assets/brand/landing-cover.webp";

// three.js is only downloaded when this hero actually renders the 3D scene.
const HeroCanvas = lazy(() => import("./HeroCanvas"));

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function Arrow() {
  return (
    <span aria-hidden="true" className="ml-3 text-base">
      →
    </span>
  );
}

function HeroCopy({ content }: { content: HomepageContent }) {
  return (
    <div className="flex w-full flex-col items-start gap-8">
      <div className="max-w-xl">
        <p className="text-[11px] tracking-[0.3em] text-blyver-champagne">
          {content.heroEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
          {content.heroTitle}
        </h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-blyver-ivory/70">
          {content.heroDescription}
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link
          to="/men"
          className="inline-flex items-center justify-center bg-blyver-ivory px-6 py-4 text-[11px] tracking-[0.17em] text-blyver-ink transition hover:bg-blyver-champagne"
        >
          SHOP MEN <Arrow />
        </Link>
        <Link
          to="/women"
          className="inline-flex items-center justify-center border border-blyver-ivory/60 px-6 py-4 text-[11px] tracking-[0.17em] transition hover:border-blyver-champagne hover:text-blyver-champagne"
        >
          SHOP WOMEN <Arrow />
        </Link>
      </div>
    </div>
  );
}

// The original photo hero, used when the browser has no WebGL.
function ImageHero({ content }: { content: HomepageContent }) {
  return (
    <section className="bg-blyver-ink text-blyver-ivory">
      <div className="aspect-[1942/809] w-full bg-black">
        <img
          src={coverImage}
          alt="Blyver watches and leather accessories"
          width={1600}
          height={667}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-12">
        <HeroCopy content={content} />
      </div>
    </section>
  );
}

// The brand photo, shown as a parallax band under the 3D hero.
function CoverBand() {
  return (
    <section className="bg-black">
      <Parallax className="relative aspect-[1942/809] w-full" offset={40}>
        <img
          src={coverImage}
          alt="Blyver watches and leather accessories"
          width={1600}
          height={667}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </Parallax>
    </section>
  );
}

// Scroll-driven 3D hero: the section is two screens tall and its inner stage
// sticks under the header, so scrolling plays the animation (the model turns
// and moves to the centre, the headline fades out and a caption fades in)
// before the page carries on.
function ThreeHero({ content }: { content: HomepageContent }) {
  const track = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const onScreen = useInView(track);
  const [sceneReady, setSceneReady] = useState(false);
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  const copyOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.45], [0, -48]);
  const captionOpacity = useTransform(scrollYProgress, [0.62, 0.9], [0, 1]);
  const captionY = useTransform(scrollYProgress, [0.62, 0.9], [32, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  return (
    <section
      ref={track}
      className={`relative bg-blyver-ink text-blyver-ivory ${
        reduceMotion ? "" : "h-[200svh]"
      }`}
    >
      <div className="sticky top-18 h-[calc(100svh-4.5rem)] min-h-[560px] overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_32%,rgba(200,170,114,0.2),transparent_60%)] lg:bg-[radial-gradient(ellipse_at_70%_50%,rgba(200,170,114,0.2),transparent_55%)]"
        />
        <div
          aria-hidden="true"
          className={`absolute inset-0 transition-opacity duration-1000 ${
            sceneReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <Suspense fallback={null}>
            <HeroCanvas
              progress={scrollYProgress}
              active={onScreen}
              reducedMotion={reduceMotion}
              onReady={() => setSceneReady(true)}
            />
          </Suspense>
        </div>
        {/* Keeps the headline readable over the model on phones. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-blyver-ink via-blyver-ink/80 to-transparent lg:hidden"
        />
        <m.div
          style={reduceMotion ? undefined : { opacity: copyOpacity, y: copyY }}
          className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-10 sm:px-10 sm:pb-14 lg:items-center lg:pb-0"
        >
          <HeroCopy content={content} />
        </m.div>
        {!reduceMotion && (
          <>
            <m.div
              aria-hidden="true"
              style={{ opacity: captionOpacity, y: captionY }}
              className="pointer-events-none absolute inset-x-0 bottom-10 z-10 px-6 text-center sm:bottom-14"
            >
              <p className="text-[11px] tracking-[0.3em] text-blyver-champagne">
                PRECISION, QUIETLY EXPRESSED
              </p>
              <p className="mt-3 font-serif text-2xl sm:text-4xl">
                Made for every day you wear it.
              </p>
            </m.div>
            <m.div
              aria-hidden="true"
              style={{ opacity: cueOpacity }}
              className="pointer-events-none absolute right-10 bottom-8 z-10 hidden items-center gap-3 text-[10px] tracking-[0.3em] text-blyver-ivory/60 lg:flex"
            >
              SCROLL
              <span className="h-px w-10 bg-blyver-ivory/40" />
            </m.div>
          </>
        )}
      </div>
    </section>
  );
}

function HeroSection({ content }: { content: HomepageContent }) {
  const [webgl] = useState(supportsWebGL);
  if (!webgl) return <ImageHero content={content} />;
  return (
    <>
      <ThreeHero content={content} />
      <CoverBand />
    </>
  );
}

export default HeroSection;
