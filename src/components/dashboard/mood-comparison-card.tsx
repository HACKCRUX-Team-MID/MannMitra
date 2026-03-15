"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts"

// Combined data showing journal vs behavior-predicted mood
const comparisonData = [
  { date: "Mar 1", journalMood: 6, predictedMood: 6 },
  { date: "Mar 2", journalMood: 5, predictedMood: 5 },
  { date: "Mar 3", journalMood: 7, predictedMood: 7 },
  { date: "Mar 4", journalMood: 4, predictedMood: 4 },
  { date: "Mar 5", journalMood: 5, predictedMood: 5 },
  { date: "Mar 6", journalMood: 6, predictedMood: 7 },
  { date: "Mar 7", journalMood: 8, predictedMood: 8 },
  { date: "Mar 8", journalMood: 7, predictedMood: 6 },
  { date: "Mar 9", journalMood: 6, predictedMood: 5 },
  { date: "Mar 10", journalMood: 5, predictedMood: 6 },
  { date: "Mar 11", journalMood: 7, predictedMood: 7 },
  { date: "Mar 12", journalMood: 6, predictedMood: 6 },
  { date: "Mar 13", journalMood: 8, predictedMood: 8 },
  { date: "Mar 14", journalMood: 7, predictedMood: 7 },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-3 shadow-lg">
        <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
        <div className="space-y-1 text-sm">
          {payload.map((entry) => (
            <p key={entry.dataKey} className="text-muted-foreground">
              {entry.dataKey === 'journalMood' ? 'What you felt' : 'What habits suggest'}:{' '}
              <span className="font-medium" style={{ color: entry.color }}>{entry.value}/10</span>
            </p>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function MoodComparisonCard() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Mood Comparison
        </CardTitle>
        <CardDescription>
          What you reported feeling vs. what your habits suggest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={comparisonData}
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
              <Legend 
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">
                    {value === 'journalMood' ? 'Journal Mood' : 'Predicted Mood'}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="journalMood"
                name="journalMood"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'var(--background)', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="predictedMood"
                name="predictedMood"
                stroke="var(--secondary)"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ fill: 'var(--secondary)', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: 'var(--secondary)', stroke: 'var(--background)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
