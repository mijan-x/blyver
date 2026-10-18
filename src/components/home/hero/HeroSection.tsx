import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  m,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { HomepageContent } from "../../../services/contentService";
import {
  chapters,
  FRAME_COUNT,
  frameAt,
  frameRect,
  frameUrl,
  loadOrder,
  pickFrameSize,
  type FrameRect,
} from "./heroSequence";
import HeroCallouts from "./HeroCallouts";
import HeroScale from "./HeroScale";

// Opacity/offset for a caption that is fully visible between `from` and `to`
// and fades over `fade` either side. Hidden captions take no clicks and are
// skipped by screen readers.
function useCaption(
  progress: MotionValue<number>,
  from: number,
  to: number,
  fade = 0.04,
) {
  const input =
    from <= 0
      ? [to, to + fade]
      : to >= 1
        ? [from - fade, from]
        : [from - fade, from, to, to + fade];
  const opacityOutput =
    from <= 0 ? [1, 0] : to >= 1 ? [0, 1] : [0, 1, 1, 0];
  const yOutput = from <= 0 ? [0, -28] : to >= 1 ? [28, 0] : [28, 0, 0, -28];
  const opacity = useTransform(progress, input, opacityOutput);
  const y = useTransform(progress, input, yOutput);
  const visibility = useTransform(opacity, (value) =>
    value < 0.02 ? "hidden" : "visible",
  );
  const pointerEvents = useTransform(opacity, (value) =>
    value > 0.6 ? "auto" : "none",
  );
  return { opacity, y, visibility, pointerEvents };
}

function ChapterCaption({
  progress,
  index,
  title,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  title: string;
  children: string;
}) {
  const chapter = chapters[index];
  const style = useCaption(progress, chapter.from, chapter.to);
  return (
    <m.div
      style={style}
      className="absolute inset-x-0 bottom-28 px-6 sm:px-10 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-sm">
          <p className="text-xs tabular-nums text-blyver-steel/70">
            {String(index + 1).padStart(2, "0")} / 05
          </p>
          <h2 className="text-metal mt-3 font-serif text-3xl leading-[1.05] sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-blyver-steel">{children}</p>
        </div>
      </div>
    </m.div>
  );
}

function HeroSection({ content }: { content: HomepageContent }) {
  const reduceMotion = useReducedMotion() ?? false;
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [frameSize] = useState(pickFrameSize);
  const [rect, setRect] = useState<FrameRect | null>(null);
  const [ready, setReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  // Function form keeps these values on the main thread (motion's native
  // scroll-timeline shortcut maps this sticky layout wrongly).
  const progress = useTransform(scrollYProgress, (value) =>
    reduceMotion ? 0 : value,
  );

  const intro = useCaption(progress, 0, chapters[0].to);
  const finale = useCaption(progress, chapters[4].from, 1);

  // Canvas: size it to the stage, load frames, and redraw when the scroll
  // position changes. Drawing eases towards the target frame for smoothness.
  useEffect(() => {
    const stageElement = stage.current;
    const canvasElement = canvas.current;
    const context = canvasElement?.getContext("2d");
    if (!stageElement || !canvasElement || !context) return;

    let cancelled = false;
    let animationFrame = 0;
    let current = frameAt(progress.get());
    let target = current;
    let drawn = false;
    let box: FrameRect = { x: 0, y: 0, w: 0, h: 0 };
    let ratio = 1;
    const images: Array<HTMLImageElement | null> = new Array(FRAME_COUNT).fill(
      null,
    );

    const nearestLoaded = (index: number) => {
      for (let distance = 0; distance < FRAME_COUNT; distance += 1) {
        const before = images[index - distance];
        if (before) return before;
        const after = images[index + distance];
        if (after) return after;
      }
      return null;
    };

    const render = () => {
      const base = Math.max(0, Math.min(FRAME_COUNT - 1, Math.floor(current)));
      const blend = current - base;
      const first = nearestLoaded(base);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, canvasElement.width, canvasElement.height);
      if (!first) return;
      context.globalAlpha = 1;
      context.drawImage(first, box.x, box.y, box.w, box.h);
      const second = images[base + 1];
      if (blend > 0.02 && second) {
        context.globalAlpha = blend;
        context.drawImage(second, box.x, box.y, box.w, box.h);
        context.globalAlpha = 1;
      }
      if (!drawn) {
        drawn = true;
        setReady(true);
      }
    };

    const tick = () => {
      animationFrame = 0;
      const gap = target - current;
      current = Math.abs(gap) < 0.01 ? target : current + gap * 0.22;
      render();
      if (current !== target) animationFrame = requestAnimationFrame(tick);
    };
    const requestDraw = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const width = stageElement.clientWidth;
      const height = stageElement.clientHeight;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvasElement.width = Math.round(width * ratio);
      canvasElement.height = Math.round(height * ratio);
      box = frameRect(width, height);
      setRect(box);
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stageElement);

    const unsubscribe = progress.on("change", (value) => {
      target = frameAt(value);
      requestDraw();
    });

    // Frame 0 first on its own, then six at a time.
    const order = reduceMotion ? [0] : loadOrder();
    let next = 0;
    let loading = 0;
    const pump = () => {
      const limit = images[0] ? 6 : 1;
      while (!cancelled && loading < limit && next < order.length) {
        const index = order[next];
        next += 1;
        loading += 1;
        const image = new Image();
        image.decoding = "async";
        image.src = frameUrl(frameSize, index);
        image
          .decode()
          .catch(() => undefined)
          .then(() => {
            loading -= 1;
            if (cancelled) return;
            if (image.naturalWidth > 0) {
              images[index] = image;
              requestDraw();
            }
            pump();
          });
      }
    };
    pump();

    return () => {
      cancelled = true;
      observer.disconnect();
      unsubscribe();
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [progress, frameSize, reduceMotion]);

  return (
    <section
      ref={track}
      aria-label="Blyver watch"
      className={`relative bg-blyver-ink text-blyver-polished ${
        reduceMotion ? "" : "h-[520svh]"
      }`}
    >
      <div
        ref={stage}
        className="sticky top-18 h-[calc(100svh-4.5rem)] min-h-[560px] overflow-hidden"
      >
        <canvas
          ref={canvas}
          aria-hidden="true"
          className={`absolute inset-0 size-full transition-opacity duration-1000 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Blend the film into the gunmetal page. */}
        {rect && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 h-48 bg-gradient-to-b from-transparent to-blyver-ink"
            style={{ top: rect.y + rect.h - 190 }}
          />
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[62%] bg-gradient-to-r from-blyver-ink/95 via-blyver-ink/55 to-transparent md:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blyver-ink/70 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-blyver-ink to-transparent"
        />

        {rect && !reduceMotion && <HeroCallouts progress={progress} rect={rect} />}

        {/* HUD corner marks, as on a camera viewfinder. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-5 sm:inset-8">
          <span className="absolute top-0 left-0 h-6 w-6 border-t border-l border-blyver-steel/35" />
          <span className="absolute top-0 right-0 h-6 w-6 border-t border-r border-blyver-steel/35" />
          <span className="absolute bottom-0 left-0 h-6 w-6 border-b border-l border-blyver-steel/35" />
          <span className="absolute right-0 bottom-0 h-6 w-6 border-r border-b border-blyver-steel/35" />
        </div>

        {/* 01: the headline from the homepage settings. */}
        <m.div
          style={intro}
          className="absolute inset-x-0 bottom-24 px-6 sm:px-10 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-[34rem]">
              <p className="type-wide text-[10px] text-blyver-steel/80">
                {content.heroEyebrow}
              </p>
              <h1 className="text-metal mt-5 font-serif text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.1rem]">
                {content.heroTitle}
              </h1>
              <p className="mt-6 max-w-sm text-sm leading-7 text-blyver-steel">
                {content.heroDescription}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/men"
                  className="btn-steel type-wide px-7 py-4 text-[10.5px]"
                >
                  SHOP MEN
                </Link>
                <Link
                  to="/women"
                  className="btn-line type-wide px-7 py-4 text-[10.5px] text-blyver-polished"
                >
                  SHOP WOMEN
                </Link>
              </div>
            </div>
          </div>
        </m.div>

        {!reduceMotion && (
          <>
            <ChapterCaption progress={progress} index={1} title="Faceted from every angle.">
              Brushed and polished surfaces alternate along the case, so it
              catches the light differently as you move.
            </ChapterCaption>
            <ChapterCaption progress={progress} index={2} title="Signed on the reverse.">
              The Blyver monogram is engraved into the caseback and repeated
              on the bracelet clasp.
            </ChapterCaption>
            <ChapterCaption progress={progress} index={3} title="An open-worked dial.">
              Look through the dial to the movement turning beneath it.
            </ChapterCaption>

            {/* 05: back to the front, ready to shop. */}
            <m.div
              style={finale}
              className="absolute inset-x-0 bottom-24 px-6 text-center sm:bottom-28"
            >
              <h2 className="text-metal font-serif text-3xl leading-tight sm:text-5xl">
                Made to be worn every day.
              </h2>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  to="/men"
                  className="btn-steel type-wide px-7 py-4 text-[10.5px]"
                >
                  SHOP MEN
                </Link>
                <Link
                  to="/women"
                  className="btn-line type-wide bg-blyver-ink/40 px-7 py-4 text-[10.5px] text-blyver-polished backdrop-blur-sm"
                >
                  SHOP WOMEN
                </Link>
              </div>
            </m.div>

            <HeroScale progress={progress} />
          </>
        )}
      </div>
    </section>
  );
}

export default HeroSection;
