"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"

// Sample data - in production this would come from the database
const moodData = [
  { date: "Mar 1", mood: 6, label: "Good" },
  { date: "Mar 2", mood: 5, label: "Okay" },
  { date: "Mar 3", mood: 7, label: "Great" },
  { date: "Mar 4", mood: 4, label: "Low" },
  { date: "Mar 5", mood: 5, label: "Okay" },
  { date: "Mar 6", mood: 6, label: "Good" },
  { date: "Mar 7", mood: 8, label: "Amazing" },
  { date: "Mar 8", mood: 7, label: "Great" },
  { date: "Mar 9", mood: 6, label: "Good" },
  { date: "Mar 10", mood: 5, label: "Okay" },
  { date: "Mar 11", mood: 7, label: "Great" },
  { date: "Mar 12", mood: 6, label: "Good" },
  { date: "Mar 13", mood: 8, label: "Amazing" },
  { date: "Mar 14", mood: 7, label: "Great" },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { label: string } }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
          Mood: <span className="font-medium text-primary">{payload[0].payload.label}</span>
        </p>
      </div>
    )
  }
  return null
}

export function MoodTrendCard() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Self-Reported Mood Trend
        </CardTitle>
        <CardDescription>
          Your mood patterns from journal entries over the past two weeks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={moodData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
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
              <Line
                type="monotone"
                dataKey="mood"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'var(--background)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
