"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import type { TutorialStep } from "./tutorial-provider";

type TutorialLabels = {
  next: string;
  back: string;
  skip: string;
};

type TooltipProps = {
  step: TutorialStep;
  stepIndex: number;
  stepsCount: number;
  labels: TutorialLabels;
  targetRect: DOMRect;
  viewport: { width: number; height: number };
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
};

type TooltipLayout = {
  top: number;
  left: number;
  arrowLeft: number;
  arrowTop: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function TutorialTooltip({
  step,
  stepIndex,
  stepsCount,
  labels,
  targetRect,
  viewport,
  onNext,
  onPrev,
  onSkip,
}: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<TooltipLayout | null>(null);

  useLayoutEffect(() => {
    if (!tooltipRef.current) {
      return;
    }

    const tooltipBounds = tooltipRef.current.getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const gap = 16;
    const margin = 16;
    const arrowSize = 12;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case "top":
        top = targetRect.top - gap - tooltipBounds.height;
        left = targetCenterX - tooltipBounds.width / 2;
        break;
      case "bottom":
        top = targetRect.bottom + gap;
        left = targetCenterX - tooltipBounds.width / 2;
        break;
      case "left":
        top = targetCenterY - tooltipBounds.height / 2;
        left = targetRect.left - gap - tooltipBounds.width;
        break;
      case "right":
      default:
        top = targetCenterY - tooltipBounds.height / 2;
        left = targetRect.right + gap;
        break;
    }

    const clampedLeft = clamp(
      left,
      margin,
      Math.max(margin, viewport.width - tooltipBounds.width - margin),
    );
    const clampedTop = clamp(
      top,
      margin,
      Math.max(margin, viewport.height - tooltipBounds.height - margin),
    );

    const arrowLeft = clamp(
      targetCenterX - clampedLeft - arrowSize / 2,
      12,
      Math.max(12, tooltipBounds.width - arrowSize - 12),
    );
    const arrowTop = clamp(
      targetCenterY - clampedTop - arrowSize / 2,
      12,
      Math.max(12, tooltipBounds.height - arrowSize - 12),
    );

    setLayout({
      top: clampedTop,
      left: clampedLeft,
      arrowLeft,
      arrowTop,
    });
  }, [step.position, targetRect, viewport.height, viewport.width]);

  const isFirst = stepIndex === 0;
  const arrowStyle =
    step.position === "top"
      ? { bottom: -6, left: layout?.arrowLeft ?? 0 }
      : step.position === "bottom"
        ? { top: -6, left: layout?.arrowLeft ?? 0 }
        : step.position === "left"
          ? { right: -6, top: layout?.arrowTop ?? 0 }
          : { left: -6, top: layout?.arrowTop ?? 0 };
  const arrowMotion =
    step.position === "top"
      ? { y: [0, 4, 0] }
      : step.position === "bottom"
        ? { y: [0, -4, 0] }
        : step.position === "left"
          ? { x: [0, 4, 0] }
          : { x: [0, -4, 0] };

  return (
    <motion.div
      ref={tooltipRef}
      className="fixed z-[100] w-[min(320px,calc(100vw-32px))]"
      style={{
        top: layout?.top ?? 0,
        left: layout?.left ?? 0,
        visibility: layout ? "visible" : "hidden",
      }}
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{
        opacity: layout ? 1 : 0,
        scale: layout ? 1 : 0.98,
        y: layout ? 0 : 8,
      }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative rounded-2xl border border-border/70 bg-background/95 p-4 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.55)]">
        <motion.span
          className="absolute h-3 w-3 rotate-45 border border-border/70 bg-background"
          style={arrowStyle}
          animate={arrowMotion}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <p className="text-sm font-medium text-foreground">{step.text}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {stepIndex + 1}/{stepsCount}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={isFirst}
              className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors duration-300 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {labels.back}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/30"
            >
              {labels.next}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full border border-transparent px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              {labels.skip}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
