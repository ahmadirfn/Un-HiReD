"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export default function MagneticButton({
  children,
  className = "",
  strength = 0.12,
}: MagneticButtonProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 18, mass: 0.12 });
  const springY = useSpring(y, { stiffness: 180, damping: 18, mass: 0.12 });

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const bounds = elementRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const offsetX = event.clientX - bounds.left - bounds.width / 2;
    const offsetY = event.clientY - bounds.top - bounds.height / 2;
    x.set(offsetX * strength);
    y.set(offsetY * strength);
  }

  function resetPosition() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={elementRef}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetPosition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
