"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Moon, Smartphone, Footprints, Heart } from "lucide-react"

const weeklyStats = {
  avgSleep: 7.2,
  sleepTrend: "improved",
  screenTime: 4.5,
  screenTrend: "increased",
  avgSteps: 8200,
  stepsTrend: "stable",
  dominantMood: "calm",
}

export function WeeklyReflectionCard() {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-secondary/5 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Heart className="h-5 w-5 text-primary" />
          Weekly Reflection
        </CardTitle>
        <CardDescription>
          A gentle summary of your week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary message */}
        <div className="rounded-xl bg-primary/5 p-4">
          <p className="leading-relaxed text-foreground">
            This week you felt mostly <span className="font-semibold text-primary">{weeklyStats.dominantMood}</span>. 
            Your sleep <span className="font-medium">{weeklyStats.sleepTrend}</span> while 
            screen time slightly <span className="font-medium">{weeklyStats.screenTrend}</span>. 
            Keep listening to what your body and mind are telling you.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-border/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weeklyStats.avgSleep}h</p>
              <p className="text-sm text-muted-foreground">Avg. Sleep</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-border/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
              <Smartphone className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weeklyStats.screenTime}h</p>
              <p className="text-sm text-muted-foreground">Screen Time</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-border/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <Footprints className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weeklyStats.avgSteps.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Avg. Steps</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
