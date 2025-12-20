"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ scale: 0, opacity: 0.15 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut", repeat: Number.POSITIVE_INFINITY }}
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0.15 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut", repeat: Number.POSITIVE_INFINITY, delay: 0.6 }}
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0.15 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut", repeat: Number.POSITIVE_INFINITY, delay: 1.2 }}
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground"
            />
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
              <svg viewBox="0 0 64 48" role="presentation" className="h-24 w-24">
                <path
                  fill="currentColor"
                  d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"
                />
              </svg>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold tracking-tight"
            >
              ГОРОД ИДЕЙ
            </motion.h1>

           
            <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="h-full w-1/2 rounded-full bg-foreground"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
