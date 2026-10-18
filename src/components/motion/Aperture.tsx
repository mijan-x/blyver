import { useRef, type ReactNode } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";

type ApertureProps = {
  children: ReactNode;
  // Classes for the frame, e.g. "absolute inset-0" or "relative aspect-[4/5]".
  className?: string;
  // How far (%) each edge starts pulled in.
  inset?: number;
};

// An image that opens like an aperture as it scrolls up the screen: the
// frame widens from a smaller window to full size while the picture inside
// settles from a slight zoom. Tied to scroll position, so it reverses too.
function Aperture({ children, className = "", inset = 12 }: ApertureProps) {
  const frame = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: frame,
    offset: ["start end", "center center"],
  });
  // Function form keeps this on the main thread (see HeroSection).
  const clipPath = useTransform(scrollYProgress, (value) => {
    if (reduceMotion) return "inset(0% 0% 0% 0%)";
    const edge = (1 - value) * inset;
    return `inset(${edge}% ${edge * 0.8}% ${edge}% ${edge * 0.8}%)`;
  });
  const scale = useTransform(scrollYProgress, (value) =>
    reduceMotion ? 1 : 1.22 - value * 0.22,
  );

  return (
    <m.div ref={frame} style={{ clipPath }} className={`overflow-hidden ${className}`}>
      <m.div style={{ scale }} className="absolute inset-0">
        {children}
      </m.div>
    </m.div>
  );
}

export default Aperture;
