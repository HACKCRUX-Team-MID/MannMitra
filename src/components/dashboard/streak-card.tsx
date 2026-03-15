// @ts-nocheck
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flower2 } from "lucide-react"

export function StreakCard() {
  const streakDays = 7 // Example streak
  const hasStreak = streakDays > 0

  return (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-accent/10 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Reflection Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div>
          {hasStreak ? (
            <>
              <p className="text-4xl font-bold text-foreground">{streakDays}</p>
              <p className="text-sm text-muted-foreground">
                {streakDays === 1 ? "day" : "days"} of reflection
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-foreground">Welcome back.</p>
              <p className="text-sm text-muted-foreground">
                {"Start a new streak today"}
              </p>
            </>
          )}
        </div>

        {/* Growing flower visualization */}
        <div className="relative">
          <div className={`rounded-full p-4 ${hasStreak ? 'bg-accent/20' : 'bg-muted/50'}`}>
            <Flower2 
              className={`h-10 w-10 transition-all ${
                hasStreak 
                  ? 'text-accent scale-100' 
                  : 'text-muted-foreground scale-75 opacity-50'
              }`}
              style={{
                filter: hasStreak ? 'drop-shadow(0 0 8px var(--accent))' : 'none'
              }}
            />
          </div>
          {/* Glowing effect for active streak */}
          {hasStreak && (
            <div className="absolute inset-0 animate-pulse rounded-full bg-accent/20 blur-xl" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
