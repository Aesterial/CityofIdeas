"use client";

import {
  AnimatePresence,
  motion,
} from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
  useTheme as useNextTheme,
} from "next-themes";

type ThemeToggleInput =
  | {
      x: number;
      y: number;
    }
  | {
      clientX?: number;
      clientY?: number;
      currentTarget?: EventTarget | null;
    }
  | undefined;

type ThemeTransitionState = {
  targetTheme: "light" | "dark";
  originX: number;
  originY: number;
  radius: number;
};

type ThemeContextValue = {
  theme: string | undefined;
  setTheme: ReturnType<typeof useNextTheme>["setTheme"];
  toggleTheme: (input?: ThemeToggleInput) => void;
  isThemeAnimating: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_TOP_OFFSET = 42;
const DEFAULT_RIGHT_OFFSET = 42;

const resolveOrigin = (input?: ThemeToggleInput) => {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  if (
    input &&
    "x" in input &&
    typeof input.x === "number" &&
    typeof input.y === "number"
  ) {
    return { x: input.x, y: input.y };
  }

  if (
    input &&
    "currentTarget" in input &&
    input.currentTarget instanceof Element
  ) {
    const rect = input.currentTarget.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  if (
    input &&
    "clientX" in input &&
    typeof input.clientX === "number" &&
    typeof input.clientY === "number"
  ) {
    return { x: input.clientX, y: input.clientY };
  }

  return {
    x: window.innerWidth - DEFAULT_RIGHT_OFFSET,
    y: DEFAULT_TOP_OFFSET,
  };
};

const resolveRadius = (originX: number, originY: number) => {
  const horizontal = Math.max(originX, window.innerWidth - originX);
  const vertical = Math.max(originY, window.innerHeight - originY);
  return Math.hypot(horizontal, vertical) + 120;
};

const sphereBackgroundByTheme: Record<"light" | "dark", string> = {
  light:
    "radial-gradient(circle at 72% 18%, rgba(255,255,255,0.98) 0, rgba(255,255,255,0.8) 12%, rgba(255,255,255,0.18) 24%, rgba(255,255,255,0) 40%), linear-gradient(180deg, rgba(250,250,250,1) 0%, rgba(236,236,236,1) 100%)",
  dark:
    "radial-gradient(circle at 72% 18%, rgba(255,255,255,0.28) 0, rgba(255,255,255,0.12) 11%, rgba(255,255,255,0) 30%), linear-gradient(180deg, rgba(34,34,34,1) 0%, rgba(12,12,12,1) 100%)",
};

function ThemeBridge({ children }: { children: ReactNode }) {
  const { setTheme, resolvedTheme } = useNextTheme();
  const [transitionState, setTransitionState] =
    useState<ThemeTransitionState | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const timeout of timeoutsRef.current) {
        window.clearTimeout(timeout);
      }
    };
  }, []);

  const toggleTheme = (input?: ThemeToggleInput) => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    if (typeof window === "undefined") {
      setTheme(nextTheme);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTheme(nextTheme);
      return;
    }

    for (const timeout of timeoutsRef.current) {
      window.clearTimeout(timeout);
    }
    timeoutsRef.current = [];

    const { x, y } = resolveOrigin(input);
    setTransitionState({
      targetTheme: nextTheme,
      originX: x,
      originY: y,
      radius: resolveRadius(x, y),
    });

    timeoutsRef.current.push(
      window.setTimeout(() => {
        setTheme(nextTheme);
      }, 100),
    );

    timeoutsRef.current.push(
      window.setTimeout(() => {
        setTransitionState(null);
      }, 200),
    );
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedTheme,
      setTheme,
      toggleTheme,
      isThemeAnimating: transitionState !== null,
    }),
    [resolvedTheme, setTheme, transitionState],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {transitionState ? (
          <motion.div
            key={`${transitionState.targetTheme}-${transitionState.originX}-${transitionState.originY}`}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[220]"
            initial={{
              clipPath: `circle(0px at ${transitionState.originX}px ${transitionState.originY}px)`,
              opacity: 1,
            }}
            animate={{
              clipPath: `circle(${transitionState.radius}px at ${transitionState.originX}px ${transitionState.originY}px)`,
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              clipPath: {
                duration: 0.52,
                ease: [0.2, 0.9, 0.22, 1],
              },
              opacity: {
                duration: 0.12,
                ease: "easeOut",
              },
            }}
            style={{
              background: sphereBackgroundByTheme[transitionState.targetTheme],
            }}
          />
        ) : null}
      </AnimatePresence>
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeBridge>{children}</ThemeBridge>
    </NextThemesProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
