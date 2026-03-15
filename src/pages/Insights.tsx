import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Download, ChevronLeft, ChevronRight, Moon, Smartphone,
  Footprints, TrendingUp, Calendar, Lightbulb, Brain, Loader2
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, Cell
} from 'recharts'

import jsPDF from 'jspdf'
import { useAuth } from '../context/AuthContext'
import { storage, type JournalEntry } from '../utils/storage'

/* ─────────────── helpers ─────────────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 6 + i)
    return d
  })
}

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 29 + i)
    return d
  })
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function startOfWeek(offset = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Mon=start
  d.setDate(diff - offset * 7)
  return d
}

function endOfWeek(start: Date) {
  const d = new Date(start)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dayName(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function moodColor(score: number | null) {
  if (score === null) return '#D1D5DB'      // gray - no entry
  if (score >= 7) return '#34D399'          // green - happy
  if (score >= 5) return '#60A5FA'          // blue  - calm/neutral
  if (score >= 3) return '#FB923C'          // orange - tired
  return '#F87171'                          // red   - stressed
}

/* demo: seed deterministic Google Fit–like data */
function seedFitData(dayIndex: number) {
  const s = (dayIndex * 1234 + 5678) % 100
  return {
    sleep: parseFloat((5.5 + (s % 30) / 10).toFixed(1)),
    screenTime: parseFloat((3 + (s % 40) / 10).toFixed(1)),
    steps: 4000 + (s % 6) * 1100,
  }
}

/* ─────────────── sub-components ─────────────── */

/* ── Word Cloud palette ── */
const WC_COLORS = ['#7C6CF2','#8E7CFF','#6F7FF6','#9B8CFF','#A78BFA','#B39DFF','#7C3AED','#6D28D9']

/** Word Cloud — replaces the tag bar chart */
function TagsWordCloud({ entries }: { entries: JournalEntry[] }) {
  const [tooltip, setTooltip] = useState<{ tag: string; count: number; x: number; y: number } | null>(null)

  const tagData = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of entries) {
      for (const tag of (e.tags || [])) {
        const clean = tag.replace(/^#/, '').toLowerCase()
        m[clean] = (m[clean] || 0) + 1
      }
    }
    const entries2 = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 16)
    return entries2.length > 0 ? entries2 : [
      ['work', 15], ['health', 12], ['family', 10], ['selfcare', 8],
      ['goals', 7], ['finance', 5], ['travel', 4], ['friends', 6],
    ] as [string, number][]
  }, [entries])

  const maxCount = Math.max(...tagData.map(([, c]) => c as number))
  const minCount = Math.min(...tagData.map(([, c]) => c as number))

  const getFontSize = (count: number) => {
    const range = maxCount - minCount || 1
    return Math.round(14 + ((count - minCount) / range) * 34) // 14px – 48px
  }

  // Shuffle for visual variety
  const shuffled = useMemo(() => {
    const arr = [...tagData]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagData.length])

  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Most Used Tags</h3>
        <div
          className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-2 min-h-[140px] py-2"
          style={{ overflow: 'visible' }}
        >
          {shuffled.map(([tag, count], i) => {
            const size = getFontSize(count as number)
            const color = WC_COLORS[i % WC_COLORS.length]
            return (
              <span
                key={tag}
                className="cursor-pointer font-bold select-none transition-all duration-150"
                style={{
                  fontSize: size,
                  color,
                  opacity: 0,
                  animation: `wcFadeIn 0.4s ease ${i * 60}ms forwards`,
                  display: 'inline-block',
                  lineHeight: 1.1,
                }}
                onMouseEnter={e => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  const parent = (e.currentTarget as HTMLElement).closest('.relative')!.getBoundingClientRect()
                  setTooltip({ tag: `#${tag}`, count: count as number, x: r.left - parent.left + r.width / 2, y: r.top - parent.top })
                  ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'
                  ;(e.currentTarget as HTMLElement).style.filter = `drop-shadow(0 0 6px ${color}88)`
                }}
                onMouseLeave={e => {
                  setTooltip(null)
                  ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                  ;(e.currentTarget as HTMLElement).style.filter = 'none'
                }}
              >
                #{tag}
              </span>
            )
          })}

          {/* Tooltip */}
          {tooltip && (
            <div style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y - 8,
              transform: 'translate(-50%, -100%)',
              background: '#1F2937',
              borderRadius: 10,
              padding: '7px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.08)',
              zIndex: 9999,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              minWidth: 110,
            }}>
              <p style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 2 }}>Tag</p>
              <p style={{ color: '#FFF', fontSize: 13, fontWeight: 700, margin: 0 }}>{tooltip.tag}</p>
              <p style={{ color: '#A78BFA', fontSize: 11, marginTop: 2 }}>Used in: {tooltip.count} {tooltip.count === 1 ? 'entry' : 'entries'}</p>
            </div>
          )}
        </div>

        {/* Keyframe */}
        <style>{`
          @keyframes wcFadeIn {
            from { opacity: 0; transform: scale(0.6); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </CardContent>
    </Card>
  )
}

/* ── Shared rich tooltip for Recharts ── */
function ChartTooltip({ active, payload, label, unit, icon }: any) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div style={{
      background: '#1F2937',
      borderRadius: 10,
      padding: '8px 12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      border: '1px solid rgba(255,255,255,0.08)',
      minWidth: 100,
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <p style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700, margin: 0 }}>
        {icon} {typeof val === 'number' ? val.toLocaleString() : val} {unit}
      </p>
    </div>
  )
}

/** 7-day bar chart wrapper */
function WeekBarChart({
  title, icon: Icon, color, data, unit,
}: {
  title: string
  icon: any
  color: string
  data: { day: string; value: number }[]
  unit: string
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  // Lighten color on hover
  const barColor = (i: number) => i === activeIdx ? color : color + 'CC'

  return (
    <Card className="border-border/50 bg-card overflow-visible">
      <CardContent className="p-4 space-y-3 overflow-visible">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color }} />
            <span className="font-semibold text-sm text-foreground">{title}</span>
          </div>
          <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground font-medium">7 Days</span>
        </div>
        <div style={{ overflow: 'visible' }}>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={data}
              barSize={32}
              margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
              onMouseLeave={() => setActiveIdx(null)}
            >
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={<ChartTooltip unit={unit} />}
                cursor={{ fill: 'rgba(124,58,237,0.07)', radius: 4 }}
                wrapperStyle={{ zIndex: 9999, outline: 'none' }}
                position={{ y: -10 }}
                isAnimationActive={false}
              />
              <Bar
                dataKey="value"
                radius={[5, 5, 0, 0]}
                onMouseEnter={(_: any, index: number) => setActiveIdx(index)}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={barColor(i)}
                    style={{
                      transition: 'all 0.15s ease',
                      transform: i === activeIdx ? 'scaleY(1.04)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                      filter: i === activeIdx ? `drop-shadow(0 0 6px ${color}88)` : 'none',
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/** Individual emoji dot on the mood wheel with hover tooltip */
function MoodEmojiDot({
  emoji, label, score, x, y, delay,
}: { emoji: string; label: string; score: number; x: number; y: number; delay: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="absolute cursor-pointer select-none"
      style={{
        top: '50%',
        left: '50%',
        width: 32, height: 32,
        marginTop: -16, marginLeft: -16,
        transform: `translate(${x}px, ${y}px)`,
        opacity: 0,
        animation: `emojiPopIn 0.35s ease ${delay}ms forwards`,
        zIndex: hovered ? 20 : 1,
        transition: 'filter 0.15s',
        filter: hovered ? 'drop-shadow(0 0 6px rgba(124,58,237,0.7))' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          fontSize: 22,
          display: 'block',
          lineHeight: 1,
          transform: hovered ? 'scale(1.25)' : 'scale(1)',
          transition: 'transform 0.15s ease',
        }}
      >
        {emoji}
      </span>
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: '115%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1F2937',
          borderRadius: 8,
          padding: '5px 10px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.09)',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          <p style={{ color: '#FFF', fontSize: 12, fontWeight: 700, margin: 0 }}>{emoji} {label}</p>
          <p style={{ color: '#A78BFA', fontSize: 10, margin: '2px 0 0' }}>Score: {score}/10</p>
        </div>
      )}
    </div>
  )
}

/** 7-day line chart for Mood Trend */
function MoodTrendChart({ data }: { data: { day: string; value: number }[] }) {
  return (
    <Card className="border-border/50 bg-card overflow-visible">
      <CardContent className="p-4 space-y-3 overflow-visible">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Mood Trend</span>
          </div>
          <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground font-medium">7 Days</span>
        </div>
        <div style={{ overflow: 'visible' }}>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={<ChartTooltip unit="/ 10" icon="😊" />}
                cursor={{ stroke: 'rgba(124,58,237,0.3)', strokeWidth: 1, strokeDasharray: '4 2' }}
                wrapperStyle={{ zIndex: 9999, outline: 'none' }}
                position={{ y: -10 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone" dataKey="value" stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }}
                activeDot={{
                  r: 7,
                  fill: '#7c3aed',
                  stroke: '#a78bfa',
                  strokeWidth: 3,
                  style: { filter: 'drop-shadow(0 0 6px #7c3aed88)' },
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Mood metadata maps ── */
const MOOD_META: Record<string, { emoji: string; label: string; glow: string }> = {
  '#34D399': { emoji: '😊', label: 'Happy',   glow: 'rgba(52,211,153,0.55)' },
  '#60A5FA': { emoji: '😌', label: 'Calm',    glow: 'rgba(96,165,250,0.55)' },
  '#FB923C': { emoji: '😴', label: 'Tired',   glow: 'rgba(251,146,60,0.55)'  },
  '#F87171': { emoji: '😟', label: 'Stressed',glow: 'rgba(248,113,113,0.55)'},
  '#D1D5DB': { emoji: '—',  label: 'No entry',glow: 'rgba(209,213,219,0.3)' },
}

/** Compute current journaling streak (consecutive days ending today) */
function computeStreak(entries: JournalEntry[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const hasEntry = entries.some(e => sameDay(new Date(e.timestamp), d))
    if (hasEntry) streak++
    else break
  }
  return streak
}

/** 30-day mood heatmap — gamified */
function MoodHeatmap({ entries }: { entries: JournalEntry[] }) {
  const days = getLast30Days()
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null)
  const streak = useMemo(() => computeStreak(entries), [entries])

  const moodForDay = useCallback((d: Date) => {
    const e = entries.find(e => sameDay(new Date(e.timestamp), d))
    return e?.intensity ?? null
  }, [entries])

  const moodLegend = [
    { color: '#34D399', emoji: '😊', label: 'Happy' },
    { color: '#60A5FA', emoji: '😌', label: 'Calm' },
    { color: '#FB923C', emoji: '😴', label: 'Tired' },
    { color: '#F87171', emoji: '😟', label: 'Stressed' },
    { color: '#D1D5DB', emoji: '—',  label: 'No entry' },
  ]

  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="p-4 space-y-3">

        {/* Header + streak badge */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">30 Day Mood Heatmap</h3>
          {streak > 0 && (
            <div className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: 'linear-gradient(90deg,#f97316,#ef4444)', color: '#fff', boxShadow: '0 0 10px rgba(249,115,22,0.5)' }}
            >
              🔥 {streak} Day{streak > 1 ? 's' : ''} Streak
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="relative" style={{ overflow: 'visible' }}>
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
          >
            {days.map((d, i) => {
              const score = moodForDay(d)
              const color = moodColor(score)
              const meta = MOOD_META[color] ?? MOOD_META['#D1D5DB']
              const isHovered = tooltip?.idx === i
              return (
                <div
                  key={i}
                  className="aspect-square rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: color,
                    opacity: 0,
                    animation: `heatFadeIn 0.3s ease ${i * 25}ms forwards`,
                    transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                    transition: 'transform 0.18s ease, filter 0.18s ease',
                    filter: isHovered ? `drop-shadow(0 0 7px ${meta.glow})` : 'none',
                    zIndex: isHovered ? 10 : 1,
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    const parentRect = (e.currentTarget as HTMLElement).closest('.relative')!.getBoundingClientRect()
                    setTooltip({ idx: i, x: rect.left - parentRect.left + rect.width / 2, y: rect.top - parentRect.top })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </div>

          {/* Custom tooltip */}
          {tooltip !== null && (() => {
            const d = days[tooltip.idx]
            const score = moodForDay(d)
            const color = moodColor(score)
            const meta = MOOD_META[color] ?? MOOD_META['#D1D5DB']
            return (
              <div
                style={{
                  position: 'absolute',
                  left: tooltip.x,
                  top: tooltip.y - 8,
                  transform: 'translate(-50%, -100%)',
                  background: '#1F2937',
                  borderRadius: 10,
                  padding: '7px 11px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  zIndex: 9999,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  minWidth: 110,
                }}
              >
                <p style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 2 }}>{fmtDate(d)}</p>
                <p style={{ color: '#FFF', fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {meta.emoji} {meta.label}
                </p>
                {score !== null && (
                  <p style={{ color: '#A78BFA', fontSize: 11, margin: '2px 0 0' }}>Score: {score}/10</p>
                )}
              </div>
            )
          })()}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-1">
          {moodLegend.map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] text-muted-foreground">{l.emoji} {l.label}</span>
            </div>
          ))}
        </div>

        {/* Fade-in keyframe */}
        <style>{`
          @keyframes heatFadeIn {
            from { opacity: 0; transform: scale(0.7); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </CardContent>
    </Card>
  )
}

/** Weekly report card */
function WeeklyReportCard({
  label, entries, weekStart, weekEnd,
}: {
  label: string
  entries: JournalEntry[]
  weekStart: Date
  weekEnd: Date
}) {
  const weekEntries = entries.filter(e => {
    const d = new Date(e.timestamp)
    return d >= weekStart && d <= weekEnd
  })

  const avgMood = weekEntries.length > 0
    ? (weekEntries.reduce((s, e) => s + (e.intensity || 5), 0) / weekEntries.length).toFixed(1)
    : '—'

  const bestDay = weekEntries.length > 0
    ? weekEntries.reduce((best, e) => (e.intensity || 0) > (best.intensity || 0) ? e : best)
    : null

  const bestDayName = bestDay ? new Date(bestDay.timestamp).toLocaleDateString('en-US', { weekday: 'short' }) : '—'

  const summaries = [
    'Your overall mood has been stable and positive this week. You showed the most energy on the weekend.',
    'You experienced some stress mid-week but recovered well by the weekend.',
    'A steady week — your journaling helped you process emotions consistently.',
    'Mixed emotions this week. Keep journaling to spot patterns early.',
  ]
  const summary = summaries[Math.abs(weekStart.getDate()) % summaries.length]

  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{label}</h3>
          <span className="text-xs text-muted-foreground">{fmtDate(weekStart)} – {fmtDate(weekEnd)}</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Avg Mood', value: avgMood },
            { label: 'Entries', value: weekEntries.length },
            { label: 'Best Day', value: bestDayName },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** AI insights panel */
function AIInsights({ entries }: { entries: JournalEntry[] }) {
  const insights = useMemo(() => {
    const results: string[] = []
    if (entries.length === 0) {
      return [
        'Start journaling daily to unlock personalized AI insights.',
        'Consistent entries help track mood patterns over time.',
      ]
    }
    const recent = entries.slice(0, 14)
    const older = entries.slice(14, 28)
    const recentAvg = recent.length > 0 ? recent.reduce((s, e) => s + (e.intensity || 5), 0) / recent.length : 5
    const olderAvg = older.length > 0 ? older.reduce((s, e) => s + (e.intensity || 5), 0) / older.length : 5

    if (recentAvg > olderAvg + 0.5) results.push('Your mood has gradually improved over the past two weeks. Keep up the positive momentum!')
    else if (recentAvg < olderAvg - 0.5) results.push('Your mood has dipped slightly recently. Journaling more frequently may help you process these feelings.')
    else results.push('Your mood has been stable over the past two weeks — consistency is a great foundation.')

    const weekendEntries = entries.filter(e => {
      const d = new Date(e.timestamp).getDay()
      return d === 0 || d === 6
    })
    if (weekendEntries.length > 0) {
      const wkAvg = weekendEntries.reduce((s, e) => s + (e.intensity || 5), 0) / weekendEntries.length
      if (wkAvg > recentAvg) results.push('Your highest mood scores tend to appear on weekends — rest and social time seem to lift your spirits.')
    }

    results.push('Days with more journaling entries tend to correlate with higher awareness and better emotional processing.')
    results.push('Tracking sleep alongside your mood can reveal powerful patterns. Try adding a sleep note to your entries.')

    return results.slice(0, 4)
  }, [entries])

  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">AI Insights</h3>
            <p className="text-[10px] text-muted-foreground">Based on your trends</p>
          </div>
        </div>
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg bg-card/70 p-3 border border-border/40">
              <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ─────────────── MAIN PAGE ─────────────── */
export default function Insights() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'reports'>('overview')
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current, 1 = last, etc.
  const [isExporting, setIsExporting] = useState(false)

  /* ── Pure jsPDF programmatic PDF export ── */
  const exportToPDF = async () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const PW = pdf.internal.pageSize.getWidth()   // 595.28 pt
      const PH = pdf.internal.pageSize.getHeight()  // 841.89 pt
      const MARGIN = 32
      const COL = PW - MARGIN * 2

      // ── helpers ──────────────────────────────────────────────
      let y = 0

      const checkPage = (needed: number) => {
        if (y + needed > PH - MARGIN) { pdf.addPage(); y = MARGIN }
      }

      const sectionTitle = (title: string) => {
        checkPage(36)
        pdf.setFillColor(124, 58, 237)
        pdf.rect(MARGIN, y, COL, 24, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(12)
        pdf.text(title, MARGIN + 10, y + 16)
        y += 32
        pdf.setTextColor(30, 27, 53)
      }

      const label = (text: string, size = 9, bold = false) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal')
        pdf.setFontSize(size)
        pdf.setTextColor(110, 106, 138)
        pdf.text(text, MARGIN, y)
        y += size + 4
      }

      const bodyText = (text: string, size = 9.5) => {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(size)
        pdf.setTextColor(30, 27, 53)
        const lines = pdf.splitTextToSize(text, COL)
        checkPage(lines.length * (size + 3) + 6)
        pdf.text(lines, MARGIN, y)
        y += lines.length * (size + 3) + 4
      }

      const miniBar = (labelTxt: string, value: number, max: number, color: [number,number,number]) => {
        checkPage(22)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8.5)
        pdf.setTextColor(110, 106, 138)
        pdf.text(labelTxt, MARGIN, y + 9)
        const barX = MARGIN + 72
        const barW = COL - 72
        const barH = 12
        pdf.setFillColor(230, 225, 248)
        pdf.roundedRect(barX, y, barW, barH, 3, 3, 'F')
        const fill = Math.max(4, (value / max) * barW)
        pdf.setFillColor(...color)
        pdf.roundedRect(barX, y, fill, barH, 3, 3, 'F')
        // value label
        pdf.setTextColor(30,27,53)
        pdf.text(String(value), barX + fill + 4, y + 9)
        y += 18
      }

      const statBox = (labels: string[], values: string[], colors: [number,number,number][]) => {
        checkPage(54)
        const bw = COL / labels.length
        labels.forEach((lbl, i) => {
          const bx = MARGIN + i * bw
          pdf.setFillColor(240, 238, 255)
          pdf.roundedRect(bx, y, bw - 6, 44, 6, 6, 'F')
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(14)
          pdf.setTextColor(...colors[i])
          pdf.text(values[i], bx + (bw - 6) / 2, y + 20, { align: 'center' })
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(8)
          pdf.setTextColor(110, 106, 138)
          pdf.text(lbl, bx + (bw - 6) / 2, y + 35, { align: 'center' })
        })
        y += 52
      }

      const barChart7 = (title: string, data: {day:string;value:number}[], unit: string, color: [number,number,number]) => {
        checkPage(96)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9.5)
        pdf.setTextColor(30, 27, 53)
        pdf.text(title, MARGIN, y)
        y += 4
        const chartH = 52
        const barW = (COL - 8) / data.length - 3
        const maxVal = Math.max(...data.map(d => d.value), 1)
        data.forEach((d, i) => {
          const bx = MARGIN + i * ((COL - 8) / data.length)
          const bh = Math.max(3, (d.value / maxVal) * chartH)
          // bg bar
          pdf.setFillColor(230, 225, 248)
          pdf.roundedRect(bx, y, barW, chartH, 3, 3, 'F')
          // value bar
          pdf.setFillColor(...color)
          pdf.roundedRect(bx, y + chartH - bh, barW, bh, 3, 3, 'F')
          // day label
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7)
          pdf.setTextColor(110, 106, 138)
          pdf.text(d.day, bx + barW / 2, y + chartH + 9, { align: 'center' })
        })
        y += chartH + 18
      }

      const heatmap30 = (entriesData: JournalEntry[]) => {
        const days = getLast30Days()
        const cellSize = (COL - 7 * 2) / 7
        checkPage(cellSize * Math.ceil(days.length / 7) + 24)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9.5)
        pdf.setTextColor(30, 27, 53)
        pdf.text('30 Day Mood Heatmap', MARGIN, y)
        y += 8
        days.forEach((d, i) => {
          const e = entriesData.find(e2 => sameDay(new Date(e2.timestamp), d))
          const sc = e?.intensity ?? null
          const hex = moodColor(sc)
          const r = parseInt(hex.slice(1,3),16)
          const g = parseInt(hex.slice(3,5),16)
          const b = parseInt(hex.slice(5,7),16)
          const col = i % 7
          const row = Math.floor(i / 7)
          const cx = MARGIN + col * (cellSize + 2)
          const cy = y + row * (cellSize + 2)
          pdf.setFillColor(r, g, b)
          pdf.roundedRect(cx, cy, cellSize, cellSize, 2, 2, 'F')
        })
        y += Math.ceil(days.length / 7) * (cellSize + 2) + 4
        // legend
        const legend = [['#34D399','Happy'],['#60A5FA','Calm'],['#FB923C','Tired'],['#F87171','Stressed'],['#D1D5DB','No entry']]
        let lx = MARGIN
        legend.forEach(([c, l]) => {
          const r2 = parseInt(c.slice(1,3),16)
          const g2 = parseInt(c.slice(3,5),16)
          const b2 = parseInt(c.slice(5,7),16)
          pdf.setFillColor(r2, g2, b2)
          pdf.rect(lx, y, 8, 8, 'F')
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7)
          pdf.setTextColor(110, 106, 138)
          pdf.text(l, lx + 10, y + 7)
          lx += 10 + pdf.getTextWidth(l) + 10
        })
        y += 16
      }

      // ════════════════════════════════════════════════════════
      //  HEADER PAGE BANNER
      // ════════════════════════════════════════════════════════
      pdf.setFillColor(124, 58, 237)
      pdf.rect(0, 0, PW, 76, 'F')
      // decorative circles
      pdf.setFillColor(255, 255, 255, 0.06)
      pdf.circle(PW - 40, 20, 50, 'F')
      pdf.circle(30, 60, 30, 'F')

      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(22)
      pdf.text('Insights Report', PW / 2, 32, { align: 'center' })
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.text(`User: ${user?.email?.split('@')[0] ?? 'User'}`, PW / 2, 50, { align: 'center' })
      pdf.text(
        `Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        PW / 2, 65, { align: 'center' }
      )

      y = 92

      // ════════════════════════════════════════════════════════
      //  SECTION 1 — OVERVIEW
      // ════════════════════════════════════════════════════════
      sectionTitle('Overview')

      // Today's mood
      const moodLabel = todayMoodScore >= 7 ? 'Good 😊' : todayMoodScore >= 5 ? 'Okay 😐' : 'Low 😔'
      label("Today's Mood", 9, true)
      statBox(
        ["Today's Mood", 'Score', 'Total Entries'],
        [moodLabel.split(' ')[0], `${todayMoodScore.toFixed(1)}/10`, String(entries.length)],
        [[124,58,237],[34,211,153],[6,182,212]]
      )
      y += 4

      // Tags chart
      label('Most Used Tags', 9, true)
      y += 2
      const tagMap: Record<string,number> = {}
      for (const e of entries) for (const t of (e.tags||[])) { const c=t.replace(/^#/,'').toLowerCase(); tagMap[c]=(tagMap[c]||0)+1 }
      const top6Tags = Object.entries(tagMap).sort((a,b)=>b[1]-a[1]).slice(0,6)
      const tagData = top6Tags.length > 0 ? top6Tags : [['health',12],['work',15],['goals',7],['family',10],['finance',5],['selfcare',8]] as [string,number][]
      const tagMax = Math.max(...tagData.map(d=>d[1] as number))
      tagData.forEach(([tag, count]) => miniBar(`#${tag}`, count as number, tagMax, [124,58,237]))
      y += 8

      // ════════════════════════════════════════════════════════
      //  SECTION 2 — PATTERNS
      // ════════════════════════════════════════════════════════
      sectionTitle('Patterns')

      statBox(
        ['Avg Mood', 'Avg Sleep', 'Avg Steps'],
        [todayMoodScore.toFixed(1), `${avgSleep}h`, `${(avgSteps/1000).toFixed(1)}K`],
        [[124,58,237],[96,165,250],[251,146,60]]
      )
      y += 4

      barChart7('Sleep Hours', fitData7.map(d=>({day:d.day,value:d.sleep})), 'hrs', [96,165,250])
      barChart7('Screen Time', fitData7.map(d=>({day:d.day,value:d.screen})), 'hrs', [251,146,60])
      barChart7('Steps Walked', fitData7.map(d=>({day:d.day,value:Math.round(d.steps/100)})), '×100', [252,165,165])
      barChart7('Mood Trend', fitData7.map(d=>({day:d.day,value:d.mood})), '/10', [124,58,237])

      heatmap30(entries)
      y += 8

      // ════════════════════════════════════════════════════════
      //  SECTION 3 — REPORTS
      // ════════════════════════════════════════════════════════
      sectionTitle('Reports')

      const reportSummaries = [
        'Your overall mood has been stable and positive this week.',
        'You experienced some stress mid-week but recovered well by the weekend.',
        'A steady week — your journaling helped you process emotions consistently.',
        'Mixed emotions this week. Keep journaling to spot patterns early.',
      ]

      const drawWeeklyCard = (cardLabel: string, wStart: Date, wEnd: Date) => {
        const wEntries = entries.filter(e => { const d=new Date(e.timestamp); return d>=wStart && d<=wEnd })
        const avg = wEntries.length > 0 ? (wEntries.reduce((s,e)=>s+(e.intensity||5),0)/wEntries.length).toFixed(1) : '—'
        const best = wEntries.length > 0 ? wEntries.reduce((b,e)=>(e.intensity||0)>(b.intensity||0)?e:b) : null
        const bestDay = best ? new Date(best.timestamp).toLocaleDateString('en-US',{weekday:'short'}) : '—'

        checkPage(90)
        // card bg
        pdf.setFillColor(249, 248, 255)
        pdf.roundedRect(MARGIN, y, COL, 78, 6, 6, 'F')
        pdf.setDrawColor(228, 224, 248)
        pdf.roundedRect(MARGIN, y, COL, 78, 6, 6, 'S')

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.setTextColor(30, 27, 53)
        pdf.text(cardLabel, MARGIN+10, y+14)

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(110, 106, 138)
        pdf.text(`${fmtDate(wStart)} – ${fmtDate(wEnd)}`, PW-MARGIN-10, y+14, {align:'right'})

        // summary text
        const summary = reportSummaries[Math.abs(wStart.getDate()) % reportSummaries.length]
        pdf.setFontSize(8.5)
        pdf.text(summary, MARGIN+10, y+26)

        // 3 stat mini-boxes
        const cols = ['Avg Mood', 'Entries', 'Best Day']
        const vals = [avg, String(wEntries.length), bestDay]
        const bw2 = (COL - 20) / 3
        cols.forEach((col, i) => {
          const bx = MARGIN + 10 + i * (bw2 + 4)
          pdf.setFillColor(237, 233, 255)
          pdf.roundedRect(bx, y+36, bw2, 32, 4, 4, 'F')
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(13)
          pdf.setTextColor(124, 58, 237)
          pdf.text(vals[i], bx + bw2/2, y+55, {align:'center'})
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7.5)
          pdf.setTextColor(110, 106, 138)
          pdf.text(col, bx+bw2/2, y+66, {align:'center'})
        })

        y += 88
      }

      drawWeeklyCard('This Week', currWeekStart0, currWeekEnd0)
      drawWeeklyCard('Last Week', prevWeekStart0, prevWeekEnd0)

      y += 4

      // ════════════════════════════════════════════════════════
      //  SECTION 4 — AI INSIGHTS
      // ════════════════════════════════════════════════════════
      sectionTitle('AI Insights')

      const recent14 = entries.slice(0,14)
      const older14 = entries.slice(14,28)
      const rAvg = recent14.length>0 ? recent14.reduce((s,e)=>s+(e.intensity||5),0)/recent14.length : 5
      const oAvg = older14.length>0 ? older14.reduce((s,e)=>s+(e.intensity||5),0)/older14.length : 5

      const aiLines: string[] = entries.length === 0
        ? [
            'Start journaling daily to unlock personalized AI insights.',
            'Consistent entries help track mood patterns over time.',
          ]
        : [
            rAvg > oAvg+0.5
              ? 'Your mood has gradually improved over the past two weeks. Keep up the positive momentum!'
              : rAvg < oAvg-0.5
                ? 'Your mood has dipped slightly recently. Journaling more frequently may help you process these feelings.'
                : 'Your mood has been stable over the past two weeks — consistency is a great foundation.',
            'Days with more journaling entries tend to correlate with higher awareness and better emotional processing.',
            'Tracking sleep alongside your mood can reveal powerful patterns. Try adding a sleep note to your entries.',
          ]

      aiLines.forEach(line => {
        checkPage(42)
        pdf.setFillColor(240, 238, 255)
        const wrapped = pdf.splitTextToSize(`💡  ${line}`, COL - 20)
        const bh = wrapped.length * 12 + 14
        pdf.roundedRect(MARGIN, y, COL, bh, 5, 5, 'F')
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.setTextColor(30, 27, 53)
        pdf.text(wrapped, MARGIN + 10, y + 14)
        y += bh + 8
      })

      // ── Footer on every page ──────────────────────────────────
      const total = pdf.getNumberOfPages()
      for (let p = 1; p <= total; p++) {
        pdf.setPage(p)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7.5)
        pdf.setTextColor(180, 176, 200)
        pdf.text('MannMitra — Insights Report', MARGIN, PH - 16)
        pdf.text(`Page ${p} of ${total}`, PW - MARGIN, PH - 16, { align: 'right' })
      }

      // ── Trigger download with proper MIME type ───────────────
      const blob = pdf.output('blob')
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'Insights_Report.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 3000)

    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('PDF generation failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      storage.getEntries(user.id)
        .then(e => { setEntries(e); setLoading(false) })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user?.id])




  /* ── 7-day chart data ── */
  const last7 = getLast7Days()
  const fitData7 = last7.map((d, i) => {
    const fit = seedFitData(i + d.getDate())
    const dayEntry = entries.find(e => sameDay(new Date(e.timestamp), d))
    return {
      day: DAYS[(d.getDay() + 6) % 7],
      sleep: fit.sleep,
      screen: fit.screenTime,
      steps: fit.steps,
      mood: dayEntry ? (dayEntry.intensity ?? 5) : fit.sleep > 7 ? 7 : 5,
    }
  })

  /* ── Today's mood ── */
  const todayEntry = entries.find(e => sameDay(new Date(e.timestamp), new Date()))
  const todayMoodScore = todayEntry?.intensity ?? 6.4
  const avgSleep = (fitData7.reduce((s, d) => s + d.sleep, 0) / 7).toFixed(1)
  const avgSteps = Math.round(fitData7.reduce((s, d) => s + d.steps, 0) / 7)

  // 8 surrounding emojis evenly at 45° increments (0°=right, going clockwise)
  const MOOD_EMOJIS = [
    { emoji: '😊', angle: -90, label: 'Happy',       score: 9.0 }, // top
    { emoji: '😌', angle: -45, label: 'Calm',        score: 7.5 }, // top-right
    { emoji: '😐', angle:   0, label: 'Neutral',     score: 5.0 }, // right
    { emoji: '😴', angle:  45, label: 'Tired',       score: 3.5 }, // bottom-right
    { emoji: '😟', angle:  90, label: 'Stressed',    score: 2.5 }, // bottom
    { emoji: '😢', angle: 135, label: 'Sad',         score: 2.0 }, // bottom-left
    { emoji: '😤', angle: 180, label: 'Frustrated',  score: 3.0 }, // left
    { emoji: '😔', angle: -135,label: 'Low',         score: 2.8 }, // top-left
  ]

  // Read dashboard Quick Mood selection (stored in localStorage by Dashboard)
  const dashboardMoodEmoji = useMemo(() => {
    const emoji = localStorage.getItem('dashboard-mood-emoji')
    return emoji || null
  }, [])

  const centerEmoji = useMemo(() => {
    // Priority: today's journal entry → dashboard quick-mood → score-based default
    if (todayEntry?.emotion) {
      const map: Record<string, string> = {
        Joy:'😊', Sadness:'😢', Anger:'😤', Apprehension:'😟', Fatigue:'😴', Contemplation:'😌'
      }
      return map[todayEntry.emotion] || '😌'
    }
    if (dashboardMoodEmoji) return dashboardMoodEmoji
    if (todayMoodScore >= 8) return '😊'
    if (todayMoodScore >= 6) return '😌'
    if (todayMoodScore >= 4) return '😐'
    return '😟'
  }, [todayEntry, dashboardMoodEmoji, todayMoodScore])

  const centerLabel = useMemo(() => {
    if (todayMoodScore >= 8) return 'Great'
    if (todayMoodScore >= 6) return 'Good'
    if (todayMoodScore >= 4) return 'Okay'
    return 'Low'
  }, [todayMoodScore])

  /* ── weeks for Reports ── */
  const currentWeekStart = startOfWeek(weekOffset)
  const currentWeekEnd = endOfWeek(currentWeekStart)
  const prevWeekStart = startOfWeek(weekOffset + 1)
  const prevWeekEnd = endOfWeek(prevWeekStart)

  const weekLabel = `${fmtDate(currentWeekStart)} – ${fmtDate(currentWeekEnd)}`

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading your insights...</p>
      </div>
    )
  }

  /* ── Derived data used by both the visible UI and the hidden PDF target ── */
  const currWeekStart0 = startOfWeek(0)
  const currWeekEnd0   = endOfWeek(currWeekStart0)
  const prevWeekStart0 = startOfWeek(1)
  const prevWeekEnd0   = endOfWeek(prevWeekStart0)

  return (
    <div className="flex flex-col gap-4 px-4 py-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Insights</h1>
        <Button
          variant="ghost" size="sm"
          onClick={exportToPDF}
          disabled={isExporting}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {isExporting
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
            : <><Download className="h-3.5 w-3.5" /> Download PDF</>}
        </Button>
      </div>

      {/* ── Tab bar ── */}
      <div className="grid grid-cols-3 rounded-full bg-muted/50 p-1 gap-1">
        {(['overview', 'patterns', 'reports'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-full py-2 text-sm font-medium capitalize transition-all',
              activeTab === tab
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">

          {/* Daily Reflection mood wheel */}
          <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-muted/10">
            <CardContent className="p-6 flex flex-col items-center">
              <p className="text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">Daily Mood Reflection</p>
              {todayEntry && (
                <p className="text-[10px] text-primary/70 mb-3">Based on today's journal entry</p>
              )}
              {!todayEntry && dashboardMoodEmoji && (
                <p className="text-[10px] text-primary/70 mb-3">Synced from Dashboard quick-mood</p>
              )}
              {!todayEntry && !dashboardMoodEmoji && (
                <p className="text-[10px] text-muted-foreground mb-3">Write a journal entry to personalise this</p>
              )}

              {/* Wheel container — fixed size for desktop, scales on mobile */}
              <div
                className="relative flex items-center justify-center"
                style={{ width: 200, height: 200 }}
              >
                {/* Dashed circle */}
                <div
                  className="absolute rounded-full border-2 border-dashed border-primary/25"
                  style={{
                    width: 180, height: 180,
                    top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    animation: 'circleFadeIn 0.5s ease forwards',
                    opacity: 0,
                  }}
                />

                {/* 8 surrounding emojis at exact 45° increments */}
                {MOOD_EMOJIS.map(({ emoji, angle, label, score }, idx) => {
                  const rad = (angle * Math.PI) / 180
                  const r = 82 // radius from center
                  const cx = Math.sin(rad) * r   // note: sin for x (0°=top convention)
                  const cy = -Math.cos(rad) * r  // -cos for y
                  const angleRad2 = ((angle + 90) * Math.PI) / 180
                  const ex = Math.cos(angleRad2) * r
                  const ey = Math.sin(angleRad2) * r
                  return (
                    <MoodEmojiDot
                      key={angle}
                      emoji={emoji}
                      label={label}
                      score={score}
                      x={ex}
                      y={ey}
                      delay={idx * 60}
                    />
                  )
                })}

                {/* Center emoji — driven by data */}
                <div
                  className="absolute flex flex-col items-center justify-center rounded-full shadow-lg"
                  style={{
                    width: 96, height: 96,
                    top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                    animation: 'circleFadeIn 0.3s ease 0.1s forwards',
                    opacity: 0,
                    boxShadow: '0 0 20px rgba(124,58,237,0.35)',
                  }}
                >
                  <span style={{ fontSize: 38, lineHeight: 1 }}>{centerEmoji}</span>
                  <p className="text-[11px] font-bold text-white/90 mt-0.5">{centerLabel}</p>
                  <p className="text-[9px] text-white/60">Today</p>
                </div>
              </div>

              {/* Mood score display */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(todayMoodScore / 10) * 100}%`,
                      background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{todayMoodScore.toFixed(1)}/10</span>
              </div>
            </CardContent>
          </Card>

          {/* styles for wheel animations */}
          <style>{`
            @keyframes circleFadeIn {
              from { opacity: 0; transform: translate(-50%,-50%) scale(0.8); }
              to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
            }
            @keyframes emojiPopIn {
              from { opacity: 0; scale: 0.4; }
              to   { opacity: 1; scale: 1; }
            }
          `}</style>

          {/* Word Cloud — replaces bar chart */}
          <TagsWordCloud entries={entries} />
        </div>
      )}

      {/* ══════════════════ PATTERNS TAB ══════════════════ */}
      {activeTab === 'patterns' && (
        <div className="flex flex-col gap-4">

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Avg Mood', value: todayMoodScore.toFixed(1), icon: TrendingUp, color: '#7c3aed', change: '+8%' },
              { label: 'Avg Sleep', value: `${avgSleep}h`, icon: Moon, color: '#60A5FA', change: '+5%' },
              { label: 'Avg Steps', value: `${(avgSteps / 1000).toFixed(1)}K`, icon: Footprints, color: '#FB923C', change: '+12%' },
            ].map(({ label, value, icon: Icon, color, change }) => (
              <Card key={label} className="border-border/50 bg-card">
                <CardContent className="p-3 space-y-1">
                  <Icon className="h-5 w-5 mb-1" style={{ color }} />
                  <p className="text-base font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-[10px] text-green-500">↑ {change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sleep Hours */}
          <WeekBarChart
            title="Sleep Hours" icon={Moon} color="#60A5FA" unit="hrs"
            data={fitData7.map(d => ({ day: d.day, value: d.sleep }))}
          />

          {/* Screen Time */}
          <WeekBarChart
            title="Screen Time" icon={Smartphone} color="#FB923C" unit="hrs"
            data={fitData7.map(d => ({ day: d.day, value: d.screen }))}
          />

          {/* Steps Walked */}
          <WeekBarChart
            title="Steps Walked" icon={Footprints} color="#FCA5A5" unit="steps"
            data={fitData7.map(d => ({ day: d.day, value: d.steps }))}
          />

          {/* Mood Trend */}
          <MoodTrendChart data={fitData7.map(d => ({ day: d.day, value: d.mood }))} />

          {/* 30-day heatmap */}
          <MoodHeatmap entries={entries} />
        </div>
      )}

      {/* ══════════════════ REPORTS TAB ══════════════════ */}
      {activeTab === 'reports' && (
        <div className="flex flex-col gap-4">

          {/* Weekly Reports header with navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-foreground">Weekly Reports</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setWeekOffset(w => Math.min(w + 1, 52))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium text-muted-foreground min-w-[80px] text-center">{weekLabel}</span>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 rounded-full"
                disabled={weekOffset === 0}
                onClick={() => setWeekOffset(w => Math.max(w - 1, 0))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current week report */}
          <WeeklyReportCard
            label={weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Last Week' : `${weekOffset} Weeks Ago`}
            entries={entries}
            weekStart={currentWeekStart}
            weekEnd={currentWeekEnd}
          />

          {/* Previous week report */}
          <WeeklyReportCard
            label={weekOffset === 0 ? 'Last Week' : weekOffset === 1 ? 'Two Weeks Ago' : `${weekOffset + 1} Weeks Ago`}
            entries={entries}
            weekStart={prevWeekStart}
            weekEnd={prevWeekEnd}
          />

          {/* AI Insights */}
          <AIInsights entries={entries} />
        </div>
      )}

    </div>
  )
}
