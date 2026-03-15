import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Footprints, BedDouble, Smartphone, Moon, RefreshCw } from 'lucide-react'
import {
  isConnected,
  getCachedData,
  fetchFitData,
  GFIT_CHANGED_EVENT,
  type FitData,
} from '../utils/googleFit'

/* ─── Helper: format minutes as "Xh Ym" ─── */
function fmtMins(mins: number | null): string {
  if (mins == null) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/* ─── Metric Card ─── */
const MetricCard = ({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
  bg,
  ring,
  progress,
  progressColor,
}: {
  icon: any
  label: string
  value: string
  sub?: string
  iconColor: string
  bg: string
  ring: string
  progress?: number | null
  progressColor?: string
}) => (
  <div className={cn('flex flex-col items-center gap-1.5 rounded-xl p-3 ring-1', bg, ring)}>
    <Icon className={cn('h-5 w-5', iconColor)} />
    <p className="text-base font-bold text-foreground leading-none">{value}</p>
    {sub && <p className={cn('text-[10px] font-medium', iconColor)}>{sub}</p>}
    <p className="text-[10px] text-muted-foreground text-center leading-tight">{label}</p>
    {progress != null && (
      <div className="w-full h-1 rounded-full bg-muted/60">
        <div
          className={cn('h-full rounded-full transition-all duration-500', progressColor)}
          style={{ width: `${Math.min(progress, 1) * 100}%` }}
        />
      </div>
    )}
  </div>
)

/* ─── Main Widget ─── */
const GoogleFitWidget = () => {
  const [connected, setConnected] = useState(false)
  const [data, setData] = useState<FitData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fitData = await fetchFitData()
      setData(fitData)
    } catch (err: any) {
      if (err.message === 'Token expired') setConnected(false)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial mount
  useEffect(() => {
    const conn = isConnected()
    setConnected(conn)
    if (conn) {
      const cached = getCachedData()
      setData(cached)
      refreshData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // React to connect/disconnect events from Settings
  useEffect(() => {
    const onGfitChanged = () => {
      const conn = isConnected()
      setConnected(conn)
      if (conn) {
        setData(getCachedData())
        refreshData()
      } else {
        setData(null)
        setError(null)
      }
    }

    const onFocus = () => {
      const conn = isConnected()
      setConnected(conn)
      if (conn && !data) refreshData()
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'setting-googlefit') {
        const conn = e.newValue === 'true'
        setConnected(conn)
        if (conn) refreshData()
        else { setData(null); setError(null) }
      }
    }

    window.addEventListener(GFIT_CHANGED_EVENT, onGfitChanged)
    window.addEventListener('focus', onFocus)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(GFIT_CHANGED_EVENT, onGfitChanged)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('storage', onStorage)
    }
  }, [data, refreshData])

  /* ── Disconnected placeholder ── */
  if (!connected) {
    return (
      <Card className="border-border/50 border-dashed">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M16.5 7.5L12 12l-2.5-2.5" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12l-2.5 2.5" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12l4.5 4.5" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12L7.5 7.5" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Google Fit</p>
              <p className="text-xs text-muted-foreground">Connect in Settings to see your health data</p>
            </div>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Connect
          </Link>
        </CardContent>
      </Card>
    )
  }

  /* ── Time since last sync display ── */
  const lastSynced = data?.lastSynced
    ? (() => {
        const mins = Math.floor((Date.now() - new Date(data.lastSynced).getTime()) / 60000)
        if (mins < 1) return 'Just now'
        if (mins < 60) return `${mins}m ago`
        return `${Math.floor(mins / 60)}h ago`
      })()
    : null

  /* ── Metric definitions ── */
  const metrics = [
    {
      icon: Smartphone,
      label: 'Screen Time',
      value: fmtMins(data?.screenTimeMinutes ?? null),
      sub: data?.screenTimeMinutes ? (data.screenTimeMinutes > 240 ? 'High' : 'Moderate') : undefined,
      iconColor: 'text-orange-400',
      bg: 'bg-orange-500/10',
      ring: 'ring-orange-500/20',
      progress: data?.screenTimeMinutes ? data.screenTimeMinutes / 480 : null, // goal: 8h
      progressColor: data?.screenTimeMinutes && data.screenTimeMinutes > 360 ? 'bg-red-400' : 'bg-orange-400',
    },
    {
      icon: BedDouble,
      label: 'Sleep Hours',
      value: data?.sleepHours != null ? `${data.sleepHours}h` : '—',
      sub: data?.sleepHours ? (data.sleepHours >= 7 ? 'Good' : 'Low') : undefined,
      iconColor: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      ring: 'ring-indigo-500/20',
      progress: data?.sleepHours ? data.sleepHours / 9 : null, // goal: 9h
      progressColor: data?.sleepHours && data.sleepHours >= 7 ? 'bg-indigo-500' : 'bg-rose-400',
    },
    {
      icon: Moon,
      label: 'Late Night',
      value: fmtMins(data?.lateNightMinutes ?? null),
      sub: data?.lateNightMinutes != null ? (data.lateNightMinutes > 30 ? '11PM–5AM' : 'Healthy') : undefined,
      iconColor: 'text-violet-500',
      bg: 'bg-violet-500/10',
      ring: 'ring-violet-500/20',
      progress: data?.lateNightMinutes ? data.lateNightMinutes / 90 : null, // concern: 90m
      progressColor: data?.lateNightMinutes && data.lateNightMinutes > 60 ? 'bg-rose-400' : 'bg-violet-400',
    },
    {
      icon: Footprints,
      label: 'Steps',
      value: data?.steps != null ? data.steps.toLocaleString() : '—',
      sub: data?.steps ? (data.steps >= 8000 ? 'Goal met!' : `${Math.round((data.steps / 10000) * 100)}%`) : undefined,
      iconColor: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      ring: 'ring-emerald-500/20',
      progress: data?.steps ? data.steps / 10000 : null,
      progressColor: data?.steps && data.steps >= 10000 ? 'bg-emerald-400' : 'bg-emerald-500',
    },
  ]

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M16.5 7.5L12 12l-2.5-2.5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 12l-2.5 2.5" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 12l4.5 4.5" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 12L7.5 7.5" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm font-semibold text-foreground">Google Fit</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="flex items-center gap-1">
            {lastSynced && (
              <span className="text-[10px] text-muted-foreground mr-1">{lastSynced}</span>
            )}
            <button
              onClick={refreshData}
              disabled={loading}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {error && (
          <p className="px-4 pb-2 text-xs text-red-400">{error}</p>
        )}

        {/* Metrics 2×2 grid */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default GoogleFitWidget
