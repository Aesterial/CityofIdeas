"use client";

import type React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function GradientButton({
  children,
  onClick,
  className,
  type = "button",
  disabled,
}: GradientButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-foreground/15 bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-[0_16px_40px_-24px_rgba(0,0,0,0.55)] transition-all duration-300 sm:px-8 sm:text-base",
        "before:absolute before:inset-px before:rounded-full before:bg-[linear-gradient(135deg,rgba(255,255,255,0.24),transparent_55%)] before:opacity-80 before:transition-opacity",
        "hover:border-foreground/30 hover:shadow-[0_22px_46px_-22px_rgba(0,0,0,0.62)] hover:before:opacity-100 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      whileHover={disabled ? undefined : { scale: 1.02, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      <span className="relative z-10 inline-flex items-center gap-3">
        {children}
      </span>
    </motion.button>
  );
}
