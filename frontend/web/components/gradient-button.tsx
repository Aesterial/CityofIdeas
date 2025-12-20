"use client"

import type React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GradientButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: "button" | "submit" | "reset"
}

export function GradientButton({ children, onClick, className, type = "button" }: GradientButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden bg-foreground text-background px-5 py-3 rounded-2xl font-medium text-sm sm:px-8 sm:py-4 sm:text-base lg:text-lg",
        "hover:shadow-2xl hover:shadow-foreground/20 transition-all duration-500",
        className,
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="relative z-10 inline-flex items-center gap-3">{children}</span>
    </motion.button>
  )
}
