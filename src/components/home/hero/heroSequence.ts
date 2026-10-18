// The home hero plays a filmed watch sequence frame by frame as the visitor
// scrolls. Frames live in /public/hero/{lg,sm}/001.webp … 083.webp: every
// second frame of the product film, cropped to remove the film's own titles.
//
// TO REPLACE THE FILM: export new frames with the same names and size
// (1060×640 for lg, 640×386 for sm), update FRAME_COUNT, then retime
// `timeline` and `chapters` below so they line up with the new shots.

export const FRAME_COUNT = 83;
export const FRAME_WIDTH = 1060;
export const FRAME_HEIGHT = 640;

export type FrameSize = "lg" | "sm";

export function frameUrl(size: FrameSize, index: number) {
  return `/hero/${size}/${String(index + 1).padStart(3, "0")}.webp`;
}

// [scroll progress, frame]. Between whole frames the two neighbours are
// cross-faded, so a step of one frame across a cut becomes a dissolve.
// Shots: 0–21 front, 22–41 profile, 42–64 caseback, 65–80 dial, 81–82 front.
const timeline: Array<[number, number]> = [
  [0, 0],
  [0.06, 0],
  [0.22, 21],
  [0.25, 22],
  [0.42, 41],
  [0.45, 42],
  [0.64, 64],
  [0.67, 65],
  [0.84, 80],
  [0.87, 81],
  [0.94, 82],
  [1, 82],
];

export function frameAt(progress: number) {
  if (progress <= 0) return 0;
  for (let index = 1; index < timeline.length; index += 1) {
    const [endProgress, endFrame] = timeline[index];
    if (progress <= endProgress) {
      const [startProgress, startFrame] = timeline[index - 1];
      const span = endProgress - startProgress || 1;
      return (
        startFrame + ((progress - startProgress) / span) * (endFrame - startFrame)
      );
    }
  }
  return FRAME_COUNT - 1;
}

export type Chapter = {
  label: string;
  // Scroll progress where the chapter's caption is fully visible.
  from: number;
  to: number;
};

export const chapters: Chapter[] = [
  { label: "Front", from: 0, to: 0.16 },
  { label: "Profile", from: 0.28, to: 0.39 },
  { label: "Caseback", from: 0.49, to: 0.6 },
  { label: "Dial", from: 0.71, to: 0.8 },
  { label: "Shop", from: 0.91, to: 1 },
];

// Load the first frame, then the first frame of each shot, then fill in
// coarse to fine, so scrubbing works long before every frame has arrived.
export function loadOrder() {
  const order: number[] = [];
  const seen = new Set<number>();
  const add = (index: number) => {
    if (index < FRAME_COUNT && !seen.has(index)) {
      seen.add(index);
      order.push(index);
    }
  };
  [0, 22, 42, 65, 81, 82].forEach(add);
  for (const step of [8, 4, 2, 1]) {
    for (let index = 0; index < FRAME_COUNT; index += step) add(index);
  }
  return order;
}

export type FrameRect = { x: number; y: number; w: number; h: number };

// Where the frame is drawn inside a stage of width × height (CSS pixels).
// Wide screens: cover the stage, slightly enlarged, with the watch a little
// right of centre to leave room for the captions. Portrait phones: the frame
// sits at the top, wider than the screen, with the captions below it.
export function frameRect(width: number, height: number): FrameRect {
  const aspect = FRAME_WIDTH / FRAME_HEIGHT;
  if (width / height < 0.9) {
    const w = width * 2.1;
    return { x: (width - w) / 2, y: 0, w, h: w / aspect };
  }
  const cover = Math.max(width / FRAME_WIDTH, height / FRAME_HEIGHT);
  const wide = width >= 1024;
  const scale = wide ? cover * 1.12 : cover;
  const w = FRAME_WIDTH * scale;
  const h = FRAME_HEIGHT * scale;
  const x = Math.min(0, Math.max(width - w, width * (wide ? 0.58 : 0.5) - w / 2));
  return { x, y: (height - h) / 2, w, h };
}

// Smaller frames on save-data or slow connections.
export function pickFrameSize(): FrameSize {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (connection?.saveData) return "sm";
  if (/2g|3g/.test(connection?.effectiveType ?? "")) return "sm";
  return "lg";
}
