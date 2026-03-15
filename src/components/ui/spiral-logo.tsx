"use client"

import { cn } from "@/lib/utils"

interface SpiralLogoProps {
  className?: string
}

export function SpiralLogo({ className }: SpiralLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      <defs>
        <linearGradient id="spiralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B7CF6" />
          <stop offset="50%" stopColor="#6EC3F4" />
          <stop offset="100%" stopColor="#F6B8A2" />
        </linearGradient>
      </defs>
      <path
        d="M20 4C11.163 4 4 11.163 4 20s7.163 16 16 16c6.627 0 12-5.373 12-12 0-4.418-3.582-8-8-8-2.761 0-5 2.239-5 5s2.239 5 5 5c1.657 0 3-1.343 3-3s-1.343-3-3-3"
        stroke="url(#spiralGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
