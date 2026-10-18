import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { domAnimation, LazyMotion } from "motion/react";
import {
  defaultHomepageContent,
  getHomepageContent,
  type HomepageContent,
} from "../services/contentService";
import EditCollage from "../components/home/EditCollage";
import HeroSection from "../components/home/hero/HeroSection";
import MenTileImage from "../components/home/MenTileImage";
import NewsletterForm from "../components/newsletter/NewsletterForm";
import Parallax from "../components/motion/Parallax";
import Reveal from "../components/motion/Reveal";
import Seo from "../components/seo/Seo";
import ladiesPursesImage from "../assets/collections/ladies-purses.webp";
import womensWatchesImage from "../assets/collections/womens-watches.webp";

const principles = [
  {
    number: "01",
    title: "Considered design",
    description:
      "Timeless forms and intentional details, selected to feel right for years to come.",
  },
  {
    number: "02",
    title: "Everyday distinction",
    description:
      "Elevated pieces made for the rhythm of real life, not just special occasions.",
  },
  {
    number: "03",
    title: "Quiet confidence",
    description:
      "A refined point of view that leaves space for your own personal expression.",
  },
];

function Arrow() {
  return (
    <span aria-hidden="true" className="ml-3 text-base">
      →
    </span>
  );
}

function HomePage() {
  const [content, setContent] = useState<HomepageContent>(
    defaultHomepageContent,
  );
  useEffect(() => {
    getHomepageContent()
      .then(setContent)
      .catch(() => undefined);
  }, []);
  return (
    <LazyMotion features={domAnimation} strict>
      <main className="overflow-x-clip bg-blyver-ivory text-blyver-ink">
        <Seo description="Blyver — premium watches, wallets and purses in Bangladesh. Where elegance meets everyday." />
        <HeroSection content={content} />

        <section className="bg-blyver-ivory px-6 py-18 sm:px-10 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-[11px] tracking-[0.26em] text-blyver-champagne">
                THE BLYVER EDIT
              </p>
              <EditCollage />
            </div>
            <Reveal>
              <h2 className="max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">
                {content.editTitle}
              </h2>
              <p className="mt-7 max-w-xl text-sm leading-7 text-blyver-charcoal/75 sm:text-base">
                {content.editDescription}
              </p>
              <Link
                to="/collections"
                className="mt-8 inline-block border-b border-blyver-ink pb-2 text-[11px] tracking-[0.18em] transition hover:border-blyver-champagne hover:text-blyver-champagne"
              >
                EXPLORE THE COLLECTION <Arrow />
              </Link>
            </Reveal>
          </div>
        </section>

        <section className="grid bg-blyver-ink text-blyver-ivory lg:grid-cols-2">
          <Link
            to="/men"
            className="group relative min-h-[510px] overflow-hidden sm:min-h-[620px]"
          >
            <Parallax className="absolute inset-0" offset={40}>
              <MenTileImage />
            </Parallax>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
            <Reveal className="absolute inset-x-0 bottom-0 p-8 sm:p-12">
              <p className="text-[11px] tracking-[0.24em] text-blyver-champagne">
                FOR HIM
              </p>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl">
                The modern classic.
              </h2>
              <span className="mt-6 inline-block text-[11px] tracking-[0.18em]">
                DISCOVER MEN <Arrow />
              </span>
            </Reveal>
          </Link>
          <Link
            to="/women"
            className="group relative min-h-[510px] overflow-hidden sm:min-h-[620px]"
          >
            <Parallax className="absolute inset-0" offset={40}>
              <img
                src={womensWatchesImage}
                alt="Blyver women's watch"
                width={900}
                height={1350}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </Parallax>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <Reveal className="absolute inset-x-0 bottom-0 p-8 sm:p-12">
              <p className="text-[11px] tracking-[0.24em] text-blyver-champagne">
                FOR HER
              </p>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl">
                Elegance, in motion.
              </h2>
              <span className="mt-6 inline-block text-[11px] tracking-[0.18em]">
                DISCOVER WOMEN <Arrow />
              </span>
            </Reveal>
          </Link>
        </section>

        <section className="bg-blyver-charcoal px-6 py-18 text-blyver-ivory sm:px-10 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal className="max-w-2xl">
              <p className="text-[11px] tracking-[0.26em] text-blyver-champagne">
                OUR PHILOSOPHY
              </p>
              <h2 className="mt-5 font-serif text-4xl leading-tight sm:text-6xl">
                A more intentional way to accessorise.
              </h2>
            </Reveal>
            <div className="mt-14 grid divide-y divide-blyver-ivory/15 border-y border-blyver-ivory/15 md:grid-cols-3 md:divide-x md:divide-y-0">
              {principles.map((principle, index) => (
                <article
                  key={principle.number}
                  className="p-7 first:pl-0 last:pr-0 md:p-9"
                >
                  <Reveal delay={index * 0.12}>
                    <p className="text-[11px] tracking-[0.2em] text-blyver-champagne">
                      {principle.number}
                    </p>
                    <h3 className="mt-10 font-serif text-2xl">{principle.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-blyver-muted">
                      {principle.description}
                    </p>
                  </Reveal>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid bg-blyver-ivory lg:grid-cols-2">
          <div className="relative min-h-[400px] overflow-hidden lg:min-h-[590px]">
            <Parallax className="absolute inset-0" offset={50}>
              <img
                src={ladiesPursesImage}
                alt="Blyver teal leather purse"
                width={900}
                height={1200}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </Parallax>
          </div>
          <div className="flex items-center px-6 py-18 sm:px-10 sm:py-24 lg:px-16">
            <Reveal className="max-w-lg">
              <p className="text-[11px] tracking-[0.26em] text-blyver-champagne">
                ELEGANT CARRY
              </p>
              <h2 className="mt-5 font-serif text-4xl leading-tight sm:text-6xl">
                Made to accompany every direction you take.
              </h2>
              <p className="mt-7 text-sm leading-7 text-blyver-charcoal/75 sm:text-base">
                Discover polished purses designed with presence, purpose, and an
                eye for the details that matter.
              </p>
              <Link
                to="/women"
                className="mt-9 inline-block border-b border-blyver-ink pb-2 text-[11px] tracking-[0.18em] transition hover:border-blyver-champagne hover:text-blyver-champagne"
              >
                SHOP LADIES’ PURSES <Arrow />
              </Link>
            </Reveal>
          </div>
        </section>

        <section className="bg-blyver-ink px-6 py-18 text-center text-blyver-ivory sm:px-10 sm:py-24">
          <Reveal className="mx-auto max-w-2xl">
            <p className="text-[11px] tracking-[0.26em] text-blyver-champagne">
              STAY IN THE KNOW
            </p>
            <h2 className="mt-5 font-serif text-4xl sm:text-6xl">
              {content.newsletterTitle}
            </h2>
            <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-blyver-muted">
              {content.newsletterDescription}
            </p>
            <NewsletterForm />
          </Reveal>
        </section>
      </main>
    </LazyMotion>
  );
}

export default HomePage;
