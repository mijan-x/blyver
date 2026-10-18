import {
  m,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from "motion/react";

// A watch head drawn with CSS and SVG: faceted octagonal case, eight screws,
// open-worked dial with turning gears. Everything moves with `progress`
// (0–1): the light sweeps round the polished steel, the gears turn and the
// hands sweep, so scrolling looks like winding the watch.

const octagon =
  "polygon(29.29% 0, 70.71% 0, 100% 29.29%, 100% 70.71%, 70.71% 100%, 29.29% 100%, 0 70.71%, 0 29.29%)";

const caseSteel =
  "conic-gradient(from var(--sheen), #4b535c, #e8ecef 7%, #8c969f 16%, #3a4249 27%, #b9c1c8 38%, #f5f7f8 46%, #7f8992 57%, #434b53 68%, #cfd5da 80%, #6f7982 90%, #4b535c)";
const bezelSteel = [
  "repeating-radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 3px)",
  "conic-gradient(from calc(var(--sheen) * -1 + 20deg), #9aa4ad, #eef1f3 12%, #7d8791 30%, #c8cfd5 48%, #f4f6f7 60%, #8a949d 78%, #9aa4ad)",
].join(", ");
const flangeSteel =
  "conic-gradient(from calc(var(--sheen) + 90deg), #59626b, #d7dde2 25%, #6c767f 50%, #cdd4d9 75%, #59626b)";

// Screws sit on the bezel just inside each corner of the octagon.
const corners: Array<[number, number]> = [
  [29.29, 0],
  [70.71, 0],
  [100, 29.29],
  [100, 70.71],
  [70.71, 100],
  [29.29, 100],
  [0, 70.71],
  [0, 29.29],
];
const screwSlots = [12, 67, 128, 31, 95, 150, 48, 110];
const screws = corners.map(([x, y], index) => ({
  left: 50 + (x - 50) * 0.8,
  top: 50 + (y - 50) * 0.8,
  slot: screwSlots[index],
}));

function gearPath(teeth: number, outer: number, root: number, hole: number) {
  const step = (Math.PI * 2) / teeth;
  const radii = [root, outer, outer, root];
  const offsets = [0, 0.2, 0.5, 0.7];
  const points: string[] = [];
  for (let tooth = 0; tooth < teeth; tooth += 1) {
    offsets.forEach((offset, corner) => {
      const angle = (tooth + offset) * step;
      points.push(
        `${(Math.cos(angle) * radii[corner]).toFixed(2)} ${(Math.sin(angle) * radii[corner]).toFixed(2)}`,
      );
    });
  }
  const ring = `M${hole} 0 A${hole} ${hole} 0 1 0 ${-hole} 0 A${hole} ${hole} 0 1 0 ${hole} 0 Z`;
  return `M${points.join(" L")} Z ${ring}`;
}

type Gear = {
  x: number;
  y: number;
  outer: number;
  teeth: number;
  speed: number;
};

// Gear centres and sizes in dial units (the dial is 200 across).
const gears: Gear[] = [
  { x: -30, y: 24, outer: 38, teeth: 18, speed: 1 },
  { x: 33, y: 34, outer: 24, teeth: 12, speed: -1.6 },
  { x: 6, y: -50, outer: 16, teeth: 10, speed: 2.4 },
];

function GearLayer({ gear, turn }: { gear: Gear; turn: MotionValue<number> }) {
  const rotate = useTransform(turn, (value) => value * gear.speed);
  const size = (gear.outer * 2) / 2; // percent of the dial
  return (
    <m.div
      style={{
        rotate,
        left: `${50 + gear.x / 2 - size / 2}%`,
        top: `${50 + gear.y / 2 - size / 2}%`,
        width: `${size}%`,
        height: `${size}%`,
      }}
      className="absolute"
    >
      <svg
        viewBox={`${-gear.outer} ${-gear.outer} ${gear.outer * 2} ${gear.outer * 2}`}
        className="size-full"
      >
        <path
          d={gearPath(gear.teeth, gear.outer, gear.outer * 0.84, gear.outer * 0.42)}
          fill="url(#blyver-bridge)"
          fillRule="evenodd"
          opacity={0.6}
        />
        {[0, 90].map((angle) => (
          <rect
            key={angle}
            x={-gear.outer * 0.44}
            y={-1.4}
            width={gear.outer * 0.88}
            height={2.8}
            fill="url(#blyver-bridge)"
            opacity={0.6}
            transform={`rotate(${angle})`}
          />
        ))}
        <circle r={gear.outer * 0.12} fill="#9e2140" />
      </svg>
    </m.div>
  );
}

function SteelBezel({
  progress,
  className = "",
}: {
  progress: MotionValue<number>;
  className?: string;
}) {
  const sheen = useTransform(progress, (value) => `${value * 300 - 40}deg`);
  const turn = useTransform(progress, (value) => value * 540);
  const minute = useTransform(progress, (value) => 60 + value * 720);
  const hour = useTransform(progress, (value) => 300 + value * 60);

  return (
    <m.div
      aria-hidden="true"
      style={{ "--sheen": sheen } as unknown as MotionStyle}
      className={`relative aspect-square drop-shadow-[0_40px_50px_rgb(0_0_0/0.55)] ${className}`}
    >
      {/* Crown */}
      <div className="absolute top-1/2 right-[-3.4%] h-[11%] w-[5%] -translate-y-1/2 rounded-[2px] bg-[repeating-linear-gradient(0deg,#e2e7ea_0_2px,#6f7982_2px_3px)] shadow-[inset_-2px_0_3px_rgb(0_0_0/0.45)]" />

      {/* Case, groove and bezel */}
      <div
        className="absolute inset-0"
        style={{ clipPath: octagon, background: caseSteel }}
      />
      <div
        className="absolute inset-[3.6%]"
        style={{
          clipPath: octagon,
          background: "linear-gradient(160deg, #0f1317, #3a424b)",
        }}
      />
      <div
        className="absolute inset-[4.6%]"
        style={{ clipPath: octagon, background: bezelSteel }}
      />

      {screws.map((screw) => (
        <div
          key={`${screw.left}-${screw.top}`}
          className="absolute aspect-square w-[6%] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[inset_0_-1px_2px_rgb(0_0_0/0.6),0_1px_1px_rgb(255_255_255/0.5)]"
          style={{
            left: `${screw.left}%`,
            top: `${screw.top}%`,
            background:
              "conic-gradient(from var(--sheen), #6f7982, #f1f4f6 30%, #8c969f 55%, #dfe4e8 80%, #6f7982)",
          }}
        >
          <span
            className="absolute inset-x-[16%] top-1/2 h-[16%] rounded-full bg-[#262c33]"
            style={{ transform: `translateY(-50%) rotate(${screw.slot}deg)` }}
          />
        </div>
      ))}

      {/* Flange and dial */}
      <div
        className="absolute inset-[17.5%] rounded-full shadow-[inset_0_2px_6px_rgb(0_0_0/0.6)]"
        style={{ background: flangeSteel }}
      />
      <div className="absolute inset-[21%] overflow-hidden rounded-full shadow-[inset_0_4px_14px_rgb(0_0_0/0.85)]">
        <svg viewBox="-100 -100 200 200" className="absolute inset-0 size-full">
          <defs>
            <radialGradient id="blyver-dial" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#2b333b" />
              <stop offset="100%" stopColor="#0f1317" />
            </radialGradient>
            <linearGradient id="blyver-bridge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#dfe4e8" />
              <stop offset="50%" stopColor="#7d8791" />
              <stop offset="100%" stopColor="#c3cad0" />
            </linearGradient>
            <linearGradient id="blyver-polish" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f7f9fa" />
              <stop offset="50%" stopColor="#9aa4ad" />
              <stop offset="100%" stopColor="#eef1f3" />
            </linearGradient>
          </defs>
          <circle r="100" fill="url(#blyver-dial)" />
          {Array.from({ length: 11 }, (_, ring) => (
            <circle
              key={ring}
              r={12 + ring * 8}
              fill="none"
              stroke="rgb(255 255 255 / 0.035)"
            />
          ))}
        </svg>

        {gears.map((gear) => (
          <GearLayer key={`${gear.x}-${gear.y}`} gear={gear} turn={turn} />
        ))}

        {/* Bridges, minute track and indices over the gears */}
        <svg viewBox="-100 -100 200 200" className="absolute inset-0 size-full">
          {[35, 155, 275].map((angle) => (
            <g key={angle} transform={`rotate(${angle})`}>
              <rect x="-6" y="-92" width="12" height="92" rx="3" fill="url(#blyver-bridge)" opacity="0.85" />
              <circle cy="-62" r="3.2" fill="#3a5f9e" stroke="#c3cad0" strokeWidth="1" />
            </g>
          ))}
          {Array.from({ length: 60 }, (_, tick) => (
            <line
              key={tick}
              y1="-96"
              y2="-91"
              stroke="rgb(220 226 231 / 0.55)"
              strokeWidth={tick % 5 === 0 ? 0 : 0.8}
              transform={`rotate(${tick * 6})`}
            />
          ))}
          {Array.from({ length: 12 }, (_, index) => (
            <rect
              key={index}
              x={index === 0 ? -4.5 : -2.2}
              y="-92"
              width={index === 0 ? 9 : 4.4}
              height="17"
              fill="url(#blyver-polish)"
              transform={`rotate(${index * 30})`}
            />
          ))}
        </svg>

        {/* Hands pivot on the dial centre */}
        <m.div style={{ rotate: hour }} className="absolute inset-0">
          <svg viewBox="-100 -100 200 200" className="size-full">
            <path d="M-4 12 L4 12 L3 -50 L0 -58 L-3 -50 Z" fill="url(#blyver-polish)" />
          </svg>
        </m.div>
        <m.div style={{ rotate: minute }} className="absolute inset-0">
          <svg viewBox="-100 -100 200 200" className="size-full">
            <path d="M-3 14 L3 14 L2 -80 L0 -88 L-2 -80 Z" fill="url(#blyver-polish)" />
            <circle r="6" fill="url(#blyver-polish)" />
            <circle r="2" fill="#3a5f9e" />
          </svg>
        </m.div>

        {/* Sapphire glare */}
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgb(255_255_255/0.14),transparent_42%,transparent_70%,rgb(255_255_255/0.05))]" />
      </div>
    </m.div>
  );
}

export default SteelBezel;
