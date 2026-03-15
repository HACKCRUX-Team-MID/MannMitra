"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Moon, Smartphone, Footprints, Heart, ChevronRight } from "lucide-react"

const weeklyReports = [
  {
    weekOf: "March 8-14, 2026",
    dominantMood: "Calm",
    avgMoodScore: 6.8,
    highlights: [
      "Sleep improved by 12% compared to last week",
      "Journaled 6 out of 7 days",
      "Weekend showed highest energy levels",
    ],
    stats: {
      avgSleep: 7.4,
      avgScreenTime: 4.2,
      avgSteps: 8500,
    },
    reflection: "This was a balanced week overall. Your consistent journaling habit seems to be helping maintain emotional stability. Consider keeping your screen time below 4 hours to potentially see further improvements.",
  },
  {
    weekOf: "March 1-7, 2026",
    dominantMood: "Mixed",
    avgMoodScore: 5.9,
    highlights: [
      "Mid-week stress peak on Wednesday",
      "Strong recovery over the weekend",
      "Step count slightly below target",
    ],
    stats: {
      avgSleep: 6.8,
      avgScreenTime: 5.1,
      avgSteps: 6200,
    },
    reflection: "A week with some challenges, but you showed resilience. The stress mid-week coincided with lower sleep and higher screen time. Remember, these patterns are just observations — you know yourself best.",
  },
]

export function WeeklyReportCard() {
  return (
    <div className="space-y-6">
      {weeklyReports.map((report, index) => (
        <Card key={index} className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Week of {report.weekOf}
                </CardTitle>
                <CardDescription className="mt-1">
                  Dominant mood: <Badge variant="outline" className="ml-1 font-normal">{report.dominantMood}</Badge>
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">{report.avgMoodScore}</p>
                <p className="text-sm text-muted-foreground">avg mood</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-3">
                <Moon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{report.stats.avgSleep}h</p>
                  <p className="text-xs text-muted-foreground">Avg Sleep</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-secondary/5 p-3">
                <Smartphone className="h-5 w-5 text-secondary" />
                <div>
                  <p className="font-semibold text-foreground">{report.stats.avgScreenTime}h</p>
                  <p className="text-xs text-muted-foreground">Screen Time</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-accent/10 p-3">
                <Footprints className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-semibold text-foreground">{report.stats.avgSteps.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Avg Steps</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Highlights */}
            <div>
              <h4 className="mb-3 font-medium text-foreground">Highlights</h4>
              <ul className="space-y-2">
                {report.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Reflection */}
            <div className="rounded-xl bg-gradient-to-br from-card to-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Gentle Reflection</h4>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {report.reflection}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
