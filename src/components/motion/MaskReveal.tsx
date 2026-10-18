import { useRef, type ReactNode } from "react";
import { m, useInView, useReducedMotion } from "motion/react";

type MaskRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

// A headline that slides up from behind a hard edge, like a steel shutter
// opening, the first time it scrolls into view. Visibility is measured on
// the outer frame: the hidden inner block sits outside its own clip, so the
// browser would never report it as on screen.
function MaskReveal({ children, className = "", delay = 0 }: MaskRevealProps) {
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();
  return (
    <div ref={frame} className={`overflow-hidden pb-[0.08em] ${className}`}>
      <m.div
        initial={reduceMotion ? false : { y: "105%" }}
        animate={inView || reduceMotion ? { y: "0%" } : { y: "105%" }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </m.div>
    </div>
  );
}

export default MaskReveal;
