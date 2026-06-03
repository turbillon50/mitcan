"use client";

import { motion, useInView, useSpring, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

export function FadeInOnScroll({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function StaggerContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}

export function HoverCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.985 }}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({
  children,
  from = "bottom",
  className = "",
}: {
  children: React.ReactNode;
  from?: "bottom" | "left" | "right" | "top";
  className?: string;
}) {
  const dir = { bottom: { y: 40 }, top: { y: -40 }, left: { x: -40 }, right: { x: 40 } };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...dir[from] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function NumberCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, spring, value]);
  useEffect(() => {
    return spring.on("change", (v) =>
      setDisplay(
        v.toLocaleString("es-MX", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      )
    );
  }, [spring, decimals]);
  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
