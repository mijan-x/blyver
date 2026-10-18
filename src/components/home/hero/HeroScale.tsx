import { m, useTransform, type MotionValue } from "motion/react";
import { chapters } from "./heroSequence";

// Where each shot begins on the scroll, matching `timeline` in heroSequence.
const shotStarts = [0, 0.24, 0.44, 0.66, 0.86];

const minuteTicks = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgb(174 183 191 / 0.3) 0 1px, transparent 1px calc(100% / 60))",
};

function ScaleLabel({
  progress,
  index,
}: {
  progress: MotionValue<number>;
  index: number;
}) {
  const start = shotStarts[index];
  const end = shotStarts[index + 1] ?? 1.01;
  const opacity = useTransform(progress, (value) =>
    value >= start && value < end ? 1 : 0.4,
  );
  const number = String(index + 1).padStart(2, "0");
  return (
    <m.span
      style={{ opacity, left: `${start * 100}%` }}
      className="absolute bottom-5 text-[10px] whitespace-nowrap tabular-nums text-blyver-polished"
    >
      <span className="sm:hidden">{number}</span>
      <span className="type-wide hidden sm:inline">
        {number} {chapters[index].label.toUpperCase()}
      </span>
    </m.span>
  );
}

// A watchmaker's scale along the foot of the hero: sixty minute ticks, a
// major tick where each shot begins, and a needle that follows the scroll.
function HeroScale({ progress }: { progress: MotionValue<number> }) {
  const needle = useTransform(progress, (value) => `${value * 100}%`);
  const cue = useTransform(progress, [0, 0.03], [1, 0]);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-7 px-6 sm:bottom-10 sm:px-10"
    >
      <div className="relative mx-auto max-w-7xl">
        <m.p
          style={{ opacity: cue }}
          className="absolute right-0 bottom-11 text-[11px] text-blyver-steel/80"
        >
          Scroll to turn the watch
        </m.p>
        {chapters.map((chapter, index) => (
          <ScaleLabel key={chapter.label} progress={progress} index={index} />
        ))}
        <div className="relative h-2.5">
          <div className="absolute inset-x-0 bottom-0 h-px bg-blyver-steel/30" />
          <div className="absolute inset-x-0 bottom-0 h-1.5" style={minuteTicks} />
          {shotStarts.map((start) => (
            <span
              key={start}
              className="absolute bottom-0 h-2.5 w-px bg-blyver-steel/70"
              style={{ left: `${start * 100}%` }}
            />
          ))}
          <m.span
            style={{ left: needle }}
            className="absolute -bottom-1 h-4 w-px bg-blyver-polished shadow-[0_0_10px_2px_rgb(85_127_196/0.8)]"
          />
        </div>
      </div>
    </div>
  );
}

export default HeroScale;
