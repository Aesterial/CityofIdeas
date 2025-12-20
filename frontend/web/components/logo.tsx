"use client"

import { motion } from "framer-motion"

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className = "h-10 w-10", showText = true }: LogoProps) {
  return (
    <motion.div
      className="flex items-center gap-2 sm:gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <svg viewBox="0 0 64 48" role="presentation" className={className}>
        <path
          fill="currentColor"
          d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"
        />
      </svg>
      {showText && <span className="text-base font-bold tracking-wide whitespace-nowrap sm:text-xl">ГОРОД ИДЕЙ</span>}
    </motion.div>
  )
}
