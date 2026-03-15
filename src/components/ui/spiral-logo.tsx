"use client"

import { cn } from "@/lib/utils"

interface SpiralLogoProps {
  className?: string
}

export function SpiralLogo({ className }: SpiralLogoProps) {
  return (
    <img 
      src="/logo.png" 
      alt="MannMitra Logo" 
      className={cn("object-contain", className)} 
    />
  )
}
