"use client";

import { motion, useReducedMotion } from "framer-motion";

// Фирменный знак mesto — пин-пузырь (место + чат) с буквой «m».
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="mesto-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6c5ce7" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path
        d="M256 48 C154 48 72 130 72 232 C72 340 180 408 244 476 Q256 490 268 476 C332 408 440 340 440 232 C440 130 358 48 256 48 Z"
        fill="url(#mesto-mark)"
      />
      <text
        x="256"
        y="300"
        fontFamily="var(--font-geist-sans), Arial, sans-serif"
        fontSize="200"
        fontWeight="800"
        fill="#fff"
        textAnchor="middle"
      >
        m
      </text>
    </svg>
  );
}

// Логотип-словарь: знак + «mesto». По ховеру знак пружинит.
export function Wordmark({ markSize = 26 }: { markSize?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="flex items-center gap-1.5">
      <motion.span
        className="inline-flex"
        whileHover={reduce ? undefined : { rotate: -10, scale: 1.12, y: -1 }}
        whileTap={reduce ? undefined : { scale: 0.88 }}
        transition={{ type: "spring", stiffness: 420, damping: 12 }}
      >
        <LogoMark size={markSize} />
      </motion.span>
      <span className="brand-gradient text-2xl font-extrabold tracking-tight">
        mesto
      </span>
    </span>
  );
}
