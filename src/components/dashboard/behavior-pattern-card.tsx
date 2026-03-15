"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"

// Sample data with behavioral metrics
const behaviorData = [
  { date: "Mar 1", predictedMood: 6, sleep: 7, screenTime: 4, steps: 8000 },
  { date: "Mar 2", predictedMood: 5, sleep: 6, screenTime: 6, steps: 5000 },
  { date: "Mar 3", predictedMood: 7, sleep: 8, screenTime: 3, steps: 10000 },
  { date: "Mar 4", predictedMood: 4, sleep: 5, screenTime: 8, steps: 3000 },
  { date: "Mar 5", predictedMood: 5, sleep: 6, screenTime: 5, steps: 6000 },
  { date: "Mar 6", predictedMood: 7, sleep: 7.5, screenTime: 4, steps: 9000 },
  { date: "Mar 7", predictedMood: 8, sleep: 8, screenTime: 2, steps: 12000 },
  { date: "Mar 8", predictedMood: 6, sleep: 6.5, screenTime: 5, steps: 7000 },
  { date: "Mar 9", predictedMood: 5, sleep: 6, screenTime: 6, steps: 5500 },
  { date: "Mar 10", predictedMood: 6, sleep: 7, screenTime: 4, steps: 8000 },
  { date: "Mar 11", predictedMood: 7, sleep: 7.5, screenTime: 3, steps: 9500 },
  { date: "Mar 12", predictedMood: 6, sleep: 7, screenTime: 4.5, steps: 7500 },
  { date: "Mar 13", predictedMood: 8, sleep: 8.5, screenTime: 2, steps: 11000 },
  { date: "Mar 14", predictedMood: 7, sleep: 7, screenTime: 3.5, steps: 8500 },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { sleep: number; screenTime: number; steps: number } }>; label?: string }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border border-border/50 bg-card p-3 shadow-lg">
        <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Sleep: <span className="font-medium text-foreground">{data.sleep}h</span></p>
          <p>Screen Time: <span className="font-medium text-foreground">{data.screenTime}h</span></p>
          <p>Steps: <span className="font-medium text-foreground">{data.steps.toLocaleString()}</span></p>
          <p className="pt-1 border-t border-border/50">
            Predicted Mood: <span className="font-medium text-secondary">{payload[0].value}/10</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function BehaviorPatternCard() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Behavior-Based Mood Prediction
        </CardTitle>
        <CardDescription>
          How your sleep, screen time, and activity may influence your mood
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={behaviorData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="behaviorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--border)" 
                opacity={0.5}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                domain={[0, 10]}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="predictedMood"
                stroke="var(--secondary)"
                strokeWidth={3}
                fill="url(#behaviorGradient)"
                dot={{ fill: 'var(--secondary)', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: 'var(--secondary)', stroke: 'var(--background)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
