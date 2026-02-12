"use client";

import { motion, useAnimation, type Variants } from "motion/react";
import * as React from "react";

type CircleCheckProps = {
  animate?: boolean;
  persistOnAnimateEnd?: boolean;
  size?: number;
  className?: string;
};

const animations = {
  circle: {},
  path: {
    initial: {
      pathLength: 1,
      opacity: 1,
      scale: 1,
    },
    animate: {
      pathLength: [0, 1],
      opacity: [0, 1],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },
  } satisfies Variants,
} as const;

function CircleCheck({
  animate = false,
  persistOnAnimateEnd = false,
  size = 28,
  className,
}: CircleCheckProps) {
  const controls = useAnimation();
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    if (animate && !hasAnimated) {
      void controls.start("animate");
      setHasAnimated(true);
    } else if (!animate && !persistOnAnimateEnd) {
      void controls.start("initial");
      setHasAnimated(false);
    }
  }, [animate, controls, hasAnimated, persistOnAnimateEnd]);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Success checkmark"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        variants={animations.circle}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="m9 12 2 2 4-4"
        variants={animations.path}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

export { CircleCheck, type CircleCheckProps };
