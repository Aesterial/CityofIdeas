"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type OverlayProps = {
  targetRect: DOMRect;
  viewport: { width: number; height: number };
  padding?: number;
  borderRadius?: number;
};

type Segment = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function TutorialOverlay({
  targetRect,
  viewport,
  padding = 8,
  borderRadius = 16,
}: OverlayProps) {
  const hole = useMemo(() => {
    const top = clamp(targetRect.top - padding, 0, viewport.height);
    const left = clamp(targetRect.left - padding, 0, viewport.width);
    const right = clamp(targetRect.right + padding, 0, viewport.width);
    const bottom = clamp(targetRect.bottom + padding, 0, viewport.height);

    return {
      top,
      left,
      right,
      bottom,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
  }, [padding, targetRect, viewport.height, viewport.width]);

  const segments = useMemo<Segment[]>(
    () =>
      [
        {
          top: 0,
          left: 0,
          width: viewport.width,
          height: hole.top,
        },
        {
          top: hole.top,
          left: 0,
          width: hole.left,
          height: hole.height,
        },
        {
          top: hole.top,
          left: hole.right,
          width: viewport.width - hole.right,
          height: hole.height,
        },
        {
          top: hole.bottom,
          left: 0,
          width: viewport.width,
          height: viewport.height - hole.bottom,
        },
      ].filter((segment) => segment.width > 0 && segment.height > 0),
    [hole, viewport.height, viewport.width],
  );

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[90]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {segments.map((segment, index) => (
        <motion.div
          key={index}
          className="pointer-events-auto absolute bg-slate-950/60 backdrop-blur-sm"
          style={{
            top: segment.top,
            left: segment.left,
            width: segment.width,
            height: segment.height,
          }}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      ))}
      <motion.div
        className="pointer-events-none absolute border border-white/40"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          borderRadius,
        }}
        layout
        animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.02, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute border border-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.45),0_0_24px_rgba(255,255,255,0.25)]"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          borderRadius,
        }}
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
}
