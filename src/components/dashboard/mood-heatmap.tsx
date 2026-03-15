"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Generate 30 days of mood data
const generateMoodData = () => {
  const moods = ['calm', 'energetic', 'low', 'stressed', 'neutral'] as const
  const data = []
  
  for (let i = 1; i <= 30; i++) {
    data.push({
      day: i,
      mood: moods[Math.floor(Math.random() * moods.length)],
      score: Math.floor(Math.random() * 5) + 4, // 4-8 range
    })
  }
  return data
}

const moodData = generateMoodData()

const moodColors: Record<string, string> = {
  calm: 'bg-[var(--mood-calm)]',
  energetic: 'bg-[var(--mood-energetic)]',
  low: 'bg-[var(--mood-low)]',
  stressed: 'bg-[var(--mood-stressed)]',
  neutral: 'bg-muted',
}

const moodLabels: Record<string, string> = {
  calm: 'Calm',
  energetic: 'Energetic',
  low: 'Low Energy',
  stressed: 'Stressed',
  neutral: 'Neutral',
}

export function MoodHeatmap() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          30-Day Mood Heatmap
        </CardTitle>
        <CardDescription>
          Your emotional patterns at a glance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Heatmap grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Weekday headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div 
              key={i} 
              className="flex h-6 items-center justify-center text-xs text-muted-foreground"
            >
              {day}
            </div>
          ))}
          
          {/* Empty cells for alignment (start on Wednesday) */}
          {[0, 1, 2].map((i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}
          
          {/* Mood cells */}
          {moodData.map((day) => (
            <div
              key={day.day}
              className={cn(
                "group relative flex h-8 cursor-pointer items-center justify-center rounded-md transition-all hover:scale-110 hover:shadow-md",
                moodColors[day.mood]
              )}
              title={`Day ${day.day}: ${moodLabels[day.mood]}`}
            >
              <span className="text-xs font-medium text-foreground/70 group-hover:text-foreground">
                {day.day}
              </span>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-card px-2 py-1 text-xs shadow-lg ring-1 ring-border/50 group-hover:block">
                {moodLabels[day.mood]}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          {Object.entries(moodLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn("h-3 w-3 rounded-sm", moodColors[key])} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
