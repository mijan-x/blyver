import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";

type MaskRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

// A headline that slides up from behind a hard edge, like a steel shutter
// opening, the first time it scrolls into view.
function MaskReveal({ children, className = "", delay = 0 }: MaskRevealProps) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={`overflow-hidden pb-[0.08em] ${className}`}>
      <m.div
        initial={reduceMotion ? false : { y: "105%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </m.div>
    </div>
  );
}

export default MaskReveal;
