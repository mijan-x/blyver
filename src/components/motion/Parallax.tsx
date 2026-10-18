import { useRef, type ReactNode } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";

type ParallaxProps = {
  children: ReactNode;
  // Classes for the clipping frame, e.g. "absolute inset-0".
  className?: string;
  // Maximum movement in px each way while the frame crosses the screen.
  offset?: number;
};

// Moves its content slower than the page scrolls, inside a clipped frame.
// The content is made `offset` px taller on each side so no gap shows.
function Parallax({ children, className = "", offset = 50 }: ParallaxProps) {
  const frame = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: frame,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [-offset, offset],
  );

  return (
    <div ref={frame} className={`overflow-hidden ${className}`}>
      <m.div
        style={{ y, top: -offset, bottom: -offset }}
        className="absolute inset-x-0"
      >
        {children}
      </m.div>
    </div>
  );
}

export default Parallax;
