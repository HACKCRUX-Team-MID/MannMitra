"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendIndicatorProps {
  value: number // percentage change
  className?: string
}

export function TrendIndicator({ value, className }: TrendIndicatorProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  return (
    <div 
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
        isPositive && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        isNegative && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        isNeutral && "bg-muted text-muted-foreground",
        className
      )}
    >
      {isPositive && <TrendingUp className="h-3 w-3" />}
      {isNegative && <TrendingDown className="h-3 w-3" />}
      {isNeutral && <Minus className="h-3 w-3" />}
      <span>{isPositive ? '+' : ''}{value}%</span>
    </div>
  )
}
