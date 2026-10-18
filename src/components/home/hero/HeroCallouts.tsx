import { m, useTransform, type MotionValue } from "motion/react";
import { FRAME_HEIGHT, FRAME_WIDTH, type FrameRect } from "./heroSequence";

// Leader lines that draw out to features of the watch on the last shot.
// Points are in frame pixels (1060×640) of the final frame, so the overlay
// scales and moves with the film.
type Callout = {
  label: string;
  anchor: [number, number];
  elbow: [number, number];
  end: [number, number];
  // Which side of the line's end the label sits on.
  side: "left" | "right";
};

const callouts: Callout[] = [
  {
    label: "Eight-screw bezel",
    anchor: [628, 205],
    elbow: [700, 140],
    end: [880, 140],
    side: "left",
  },
  {
    label: "Open-worked dial",
    anchor: [590, 300],
    elbow: [700, 320],
    end: [880, 320],
    side: "left",
  },
  {
    label: "Integrated bracelet",
    anchor: [578, 455],
    elbow: [660, 500],
    end: [880, 500],
    side: "left",
  },
];

function CalloutLine({
  callout,
  progress,
  delay,
}: {
  callout: Callout;
  progress: MotionValue<number>;
  delay: number;
}) {
  const start = 0.88 + delay;
  const pathLength = useTransform(progress, [start, start + 0.05], [0, 1]);
  const dot = useTransform(progress, [start - 0.01, start], [0, 1]);
  const [ax, ay] = callout.anchor;
  const [ex, ey] = callout.elbow;
  const [fx, fy] = callout.end;
  return (
    <g>
      <m.circle
        cx={ax}
        cy={ay}
        r={7}
        fill="none"
        stroke="rgb(244 246 247 / 0.8)"
        strokeWidth={0.8}
        style={{ opacity: dot }}
      />
      <m.circle
        cx={ax}
        cy={ay}
        r={2.4}
        fill="rgb(244 246 247)"
        style={{ opacity: dot }}
      />
      <m.path
        d={`M${ax} ${ay} L${ex} ${ey} L${fx} ${fy}`}
        fill="none"
        stroke="rgb(244 246 247 / 0.7)"
        strokeWidth={0.8}
        style={{ pathLength }}
      />
    </g>
  );
}

function CalloutLabel({
  callout,
  progress,
  delay,
}: {
  callout: Callout;
  progress: MotionValue<number>;
  delay: number;
}) {
  const start = 0.92 + delay;
  const opacity = useTransform(progress, [start, start + 0.03], [0, 1]);
  const [x, y] = callout.end;
  return (
    <m.p
      style={{
        opacity,
        left: `${(x / FRAME_WIDTH) * 100}%`,
        top: `${(y / FRAME_HEIGHT) * 100}%`,
      }}
      className={`type-wide absolute -translate-y-[160%] text-[10px] whitespace-nowrap text-blyver-polished [text-shadow:0_1px_8px_rgb(23_27_32/0.9)] ${
        callout.side === "left" ? "-translate-x-full text-right" : ""
      }`}
    >
      {callout.label.toUpperCase()}
    </m.p>
  );
}

function HeroCallouts({
  progress,
  rect,
}: {
  progress: MotionValue<number>;
  rect: FrameRect;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute hidden md:block"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      <svg
        viewBox={`0 0 ${FRAME_WIDTH} ${FRAME_HEIGHT}`}
        className="absolute inset-0 size-full overflow-visible"
      >
        {callouts.map((callout, index) => (
          <CalloutLine
            key={callout.label}
            callout={callout}
            progress={progress}
            delay={index * 0.012}
          />
        ))}
      </svg>
      {callouts.map((callout, index) => (
        <CalloutLabel
          key={callout.label}
          callout={callout}
          progress={progress}
          delay={index * 0.012}
        />
      ))}
    </div>
  );
}

export default HeroCallouts;
