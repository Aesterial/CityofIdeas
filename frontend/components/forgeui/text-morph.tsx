"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type TextMorphProps = {
  words?: readonly string[];
  interval?: number;
  className?: string;
  charClassName?: string;
};

const defaultWords = ["engineer", "developer", "designer"] as const;

export function TextMorph({
  words = defaultWords,
  interval = 2500,
  className,
  charClassName,
}: TextMorphProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!words.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  if (!words.length) return null;

  return (
    <span
      className={`relative align-baseline ${className ?? ""}`}
      style={{ display: "inline-grid", gridTemplateAreas: '"stack"' }}
    >
      <span
        aria-hidden="true"
        className="invisible whitespace-pre"
        style={{ gridArea: "stack" }}
      >
        {words.reduce((longest, word) =>
          word.length > longest.length ? word : longest,
        )}
      </span>
      <span
        className="relative flex items-baseline overflow-hidden"
        style={{ gridArea: "stack" }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={index}
            className="flex gap-[0.5px]"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4 }}
          >
            {Array.from(words[index] ?? "").map((char, i) => (
              <motion.span
                key={i}
                className={charClassName}
                initial={{ opacity: 0, y: 5, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -5, filter: "blur(5px)" }}
                transition={{
                  delay: i * 0.03,
                  duration: 0.3,
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
