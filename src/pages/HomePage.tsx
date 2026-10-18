import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  m,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  defaultHomepageContent,
  getHomepageContent,
  type HomepageContent,
} from "../services/contentService";
import EditCollage from "../components/home/EditCollage";
import HeroSection from "../components/home/hero/HeroSection";
import MenTileImage from "../components/home/MenTileImage";
import SteelBezel from "../components/home/SteelBezel";
import Aperture from "../components/motion/Aperture";
import MaskReveal from "../components/motion/MaskReveal";
import Reveal from "../components/motion/Reveal";
import NewsletterForm from "../components/newsletter/NewsletterForm";
import Seo from "../components/seo/Seo";
import ladiesPursesImage from "../assets/collections/ladies-purses.webp";
import womensWatchesImage from "../assets/collections/womens-watches.webp";

const principles = [
  {
    title: "Considered design",
    description:
      "Timeless forms and intentional details, selected to feel right for years to come.",
  },
  {
    title: "Everyday distinction",
    description:
      "Elevated pieces made for the rhythm of real life, not just special occasions.",
  },
  {
    title: "Quiet confidence",
    description:
      "A refined point of view that leaves space for your own personal expression.",
  },
];

const steelEdge =
  "h-px bg-gradient-to-r from-transparent via-blyver-steel/35 to-transparent";

function SectionLabel({
  children,
  tone = "dark",
}: {
  children: ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <p
      className={`type-wide text-[10px] ${
        tone === "dark" ? "text-blyver-steel/75" : "text-blyver-blued-deep"
      }`}
    >
      {children}
    </p>
  );
}

function EditSection({ content }: { content: HomepageContent }) {
  return (
    <section className="brushed relative text-blyver-polished">
      <div aria-hidden="true" className={steelEdge} />
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-36 lg:self-start">
          <Reveal>
            <SectionLabel>THE BLYVER EDIT</SectionLabel>
          </Reveal>
          <MaskReveal className="mt-5">
            <h2 className="text-metal font-serif text-4xl leading-[1.04] sm:text-6xl">
              {content.editTitle}
            </h2>
          </MaskReveal>
          <Reveal delay={0.1}>
            <p className="mt-7 max-w-md text-sm leading-7 text-blyver-steel sm:text-base">
              {content.editDescription}
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <Link
              to="/collections"
              className="btn-line type-wide mt-10 px-7 py-4 text-[10.5px]"
            >
              EXPLORE THE COLLECTION
            </Link>
          </Reveal>
        </div>
        <EditCollage />
      </div>
    </section>
  );
}

function GenderPanel({
  to,
  label,
  title,
  cta,
  children,
}: {
  to: string;
  label: string;
  title: string;
  cta: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group relative block h-[85svh] min-h-[520px] overflow-hidden bg-blyver-ink"
    >
      <Aperture className="absolute inset-0">{children}</Aperture>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blyver-ink via-blyver-ink/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12">
        <Reveal>
          <SectionLabel>{label}</SectionLabel>
        </Reveal>
        <MaskReveal className="mt-4">
          <h2 className="text-metal font-serif text-4xl leading-[1.05] sm:text-5xl">
            {title}
          </h2>
        </MaskReveal>
        <span className="type-wide mt-7 inline-flex items-center gap-4 text-[10.5px] text-blyver-polished">
          {cta}
          <span
            aria-hidden="true"
            className="h-px w-10 bg-blyver-steel transition-all duration-500 group-hover:w-20"
          />
        </span>
      </div>
    </Link>
  );
}

function GenderPanels() {
  return (
    <section className="grid gap-px bg-blyver-steel/15 lg:grid-cols-2">
      <GenderPanel
        to="/men"
        label="FOR HIM"
        title="The modern classic."
        cta="DISCOVER MEN"
      >
        <MenTileImage />
      </GenderPanel>
      <GenderPanel
        to="/women"
        label="FOR HER"
        title="Elegance, in motion."
        cta="DISCOVER WOMEN"
      >
        <img
          src={womensWatchesImage}
          alt="Blyver women's watch"
          width={900}
          height={1350}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition duration-1000 group-hover:scale-105"
        />
      </GenderPanel>
    </section>
  );
}

// Visible window for each principle on the section's scroll (0–1).
const principleWindows = [
  { input: [0.3, 0.36], opacity: [1, 0], y: [0, -24] },
  {
    input: [0.3, 0.36, 0.63, 0.69],
    opacity: [0, 1, 1, 0],
    y: [24, 0, 0, -24],
  },
  { input: [0.63, 0.69], opacity: [0, 1], y: [24, 0] },
];

function Principle({
  progress,
  index,
}: {
  progress: MotionValue<number>;
  index: number;
}) {
  const visible = principleWindows[index];
  const opacity = useTransform(progress, visible.input, visible.opacity);
  const y = useTransform(progress, visible.input, visible.y);
  const principle = principles[index];
  return (
    <m.article style={{ opacity, y }} className="absolute inset-x-0 top-0">
      <h3 className="font-serif text-2xl text-blyver-polished sm:text-3xl">
        {principle.title}
      </h3>
      <p className="mt-4 max-w-sm text-sm leading-7 text-blyver-steel">
        {principle.description}
      </p>
    </m.article>
  );
}

function PrincipleMeter({
  progress,
  index,
}: {
  progress: MotionValue<number>;
  index: number;
}) {
  const scaleX = useTransform(progress, (value) =>
    Math.min(1, Math.max(0, value * 3 - index)),
  );
  return (
    <span className="relative h-px flex-1 bg-blyver-steel/20">
      <m.span
        style={{ scaleX }}
        className="absolute inset-0 origin-left bg-blyver-polished"
      />
    </span>
  );
}

// Philosophy: the steel watch head turns with the scroll while the three
// principles take turns beside it.
function MechanicsSection() {
  const track = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  const progress = useTransform(scrollYProgress, (value) =>
    reduceMotion ? 0 : value,
  );

  if (reduceMotion) {
    return (
      <section className="bg-blyver-ink px-6 py-24 text-blyver-polished sm:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <SteelBezel
            progress={progress}
            className="mx-auto w-[min(70vw,420px)]"
          />
          <div>
            <SectionLabel>OUR PHILOSOPHY</SectionLabel>
            <h2 className="text-metal mt-5 font-serif text-4xl leading-tight sm:text-5xl">
              A more intentional way to accessorise.
            </h2>
            <div className="mt-10 space-y-8">
              {principles.map((principle) => (
                <article key={principle.title}>
                  <h3 className="font-serif text-2xl">{principle.title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-blyver-steel">
                    {principle.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={track}
      className="relative h-[320svh] bg-blyver-ink text-blyver-polished"
    >
      <div className="sticky top-18 flex h-[calc(100svh-4.5rem)] min-h-[560px] items-center overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgb(85_127_196/0.12),transparent_55%)]"
        />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16">
          <SteelBezel
            progress={progress}
            className="mx-auto w-[min(64vw,36svh)] lg:w-[min(38vw,64svh)]"
          />
          <div>
            <SectionLabel>OUR PHILOSOPHY</SectionLabel>
            <h2 className="text-metal mt-4 font-serif text-3xl leading-[1.05] sm:text-5xl">
              A more intentional way to accessorise.
            </h2>
            <div className="relative mt-8 h-36 sm:mt-12 sm:h-40">
              {principles.map((principle, index) => (
                <Principle
                  key={principle.title}
                  progress={progress}
                  index={index}
                />
              ))}
            </div>
            <div aria-hidden="true" className="flex max-w-sm gap-2">
              {principles.map((principle, index) => (
                <PrincipleMeter
                  key={principle.title}
                  progress={progress}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CarrySection() {
  return (
    <section className="brushed-light text-blyver-ink">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-2 lg:gap-20">
        <Aperture className="relative aspect-[4/5] w-full" inset={10}>
          <img
            src={ladiesPursesImage}
            alt="Blyver teal leather purse"
            width={900}
            height={1200}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </Aperture>
        <div>
          <Reveal>
            <SectionLabel tone="light">ELEGANT CARRY</SectionLabel>
          </Reveal>
          <MaskReveal className="mt-5">
            <h2 className="font-serif text-4xl leading-[1.04] sm:text-6xl">
              Made to accompany every direction you take.
            </h2>
          </MaskReveal>
          <Reveal delay={0.1}>
            <p className="mt-7 max-w-md text-sm leading-7 text-blyver-charcoal/75 sm:text-base">
              Discover polished purses designed with presence, purpose, and an
              eye for the details that matter.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <Link
              to="/women"
              className="type-wide mt-10 inline-flex items-center bg-blyver-ink px-7 py-4 text-[10.5px] text-blyver-polished transition-colors hover:bg-blyver-charcoal"
            >
              SHOP LADIES’ PURSES
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection({ content }: { content: HomepageContent }) {
  return (
    <section className="relative overflow-hidden bg-blyver-ink px-6 py-28 text-center text-blyver-polished sm:px-10 sm:py-36">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgb(85_127_196/0.16),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 ${steelEdge}`}
      />
      <div className="relative mx-auto max-w-2xl">
        <Reveal>
          <SectionLabel>STAY IN THE KNOW</SectionLabel>
        </Reveal>
        <MaskReveal className="mt-5">
          <h2 className="text-metal font-serif text-4xl leading-tight sm:text-6xl">
            {content.newsletterTitle}
          </h2>
        </MaskReveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-blyver-steel">
            {content.newsletterDescription}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <NewsletterForm />
        </Reveal>
      </div>
    </section>
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
    <main className="overflow-x-clip bg-blyver-ink text-blyver-polished">
      <Seo description="Blyver — premium watches, wallets and purses in Bangladesh. Where elegance meets everyday." />
      <HeroSection content={content} />
      <EditSection content={content} />
      <GenderPanels />
      <MechanicsSection />
      <CarrySection />
      <NewsletterSection content={content} />
    </main>
  );
}

export default HomePage;
