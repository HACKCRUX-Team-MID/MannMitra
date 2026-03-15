"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Generate 90 days of mood data (3 months)
const generateMoodData = () => {
  const moods = ['calm', 'energetic', 'low', 'stressed', 'neutral'] as const
  const data = []
  
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toISOString().split('T')[0],
      mood: moods[Math.floor(Math.random() * moods.length)],
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
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

export function MoodHeatmapExtended() {
  // Group by weeks for display
  const weeks: typeof moodData[] = []
  for (let i = 0; i < moodData.length; i += 7) {
    weeks.push(moodData.slice(i, i + 7))
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">90-Day Mood Overview</CardTitle>
        <CardDescription>Your emotional journey over the past three months</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Heatmap grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[600px]">
            {/* Weekday labels */}
            <div className="mb-2 flex gap-1">
              <div className="w-10" />
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div 
                  key={i} 
                  className="flex h-5 w-5 items-center justify-center text-xs text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Weeks grid */}
            <div className="flex flex-col gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex items-center gap-1">
                  {/* Month label for first week of month */}
                  <div className="w-10 text-xs text-muted-foreground">
                    {weekIndex === 0 || week[0]?.day <= 7 ? week[0]?.month : ''}
                  </div>
                  
                  {/* Day cells */}
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={cn(
                        "group relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm transition-all hover:scale-125 hover:shadow-md",
                        moodColors[day.mood]
                      )}
                      title={`${day.date}: ${moodLabels[day.mood]}`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-card px-2 py-1 text-xs shadow-lg ring-1 ring-border/50 group-hover:block">
                        <p className="font-medium">{day.date}</p>
                        <p className="text-muted-foreground">{moodLabels[day.mood]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 border-t border-border/50 pt-4">
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
