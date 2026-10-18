import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  // Seconds to wait before animating (use for staggered groups).
  delay?: number;
  // How far (px) the content rises as it fades in.
  distance?: number;
};

// Fades and lifts its content in the first time it scrolls into view.
// Must be rendered inside <LazyMotion> (see HomePage). Visitors who ask their
// system for reduced motion see the content immediately.
function Reveal({ children, className, delay = 0, distance = 28 }: RevealProps) {
  const reduceMotion = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

export default Reveal;
