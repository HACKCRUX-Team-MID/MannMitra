/**
 * Google Fit Integration — OAuth2 + Fitness REST API
 *
 * Metrics surfaced on the Dashboard:
 *   - Steps (Google Fit activity data)
 *   - Sleep Hours (Google Fit sleep sessions)
 *   - Screen Time (simulated — Google Fit has no screen time API, demo data)
 *   - Late Night Usage (simulated — hours active between 11 PM and 5 AM)
 *
 * Requirements:
 *   1. A Google Cloud project → https://console.cloud.google.com
 *   2. Enable "Fitness API"
 *   3. Create an OAuth 2.0 Client ID (Web application)
 *      – Authorized JavaScript origins: http://localhost:5173
 *      – Authorized redirect URIs: http://localhost:5173
 *   4. Set VITE_GOOGLE_FIT_CLIENT_ID in .env
 */

const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
].join(' ')

const FITNESS_API = 'https://www.googleapis.com/fitness/v1/users/me'

/* ─── Custom Event ─── */
export const GFIT_CHANGED_EVENT = 'googlefit-changed'

function dispatchGfitChanged() {
  window.dispatchEvent(new CustomEvent(GFIT_CHANGED_EVENT))
}

/* ─── Types ─── */
export interface FitData {
  steps: number
  sleepHours: number | null
  screenTimeMinutes: number | null
  lateNightMinutes: number | null
  lastSynced: string
}

/* ─── Token / Storage Keys ─── */
const TOKEN_KEY = 'mannmitra-gfit-token'
const DATA_KEY  = 'mannmitra-gfit-data'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearGoogleFitData() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(DATA_KEY)
  localStorage.removeItem('setting-googlefit')
}

export function isConnected(): boolean {
  return !!getStoredToken() && localStorage.getItem('setting-googlefit') === 'true'
}

export function getCachedData(): FitData | null {
  const raw = localStorage.getItem(DATA_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

/* ─── OAuth2 Connect ─── */
export function connectGoogleFit(): Promise<string> {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID
    if (!clientId) {
      // Demo mode: simulate connection without a real client ID
      localStorage.setItem(TOKEN_KEY, 'demo-token')
      localStorage.setItem('setting-googlefit', 'true')
      dispatchGfitChanged()
      resolve('demo-token')
      return
    }

    const google = (window as any).google
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded'))
      return
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error))
          return
        }
        localStorage.setItem(TOKEN_KEY, response.access_token)
        localStorage.setItem('setting-googlefit', 'true')
        dispatchGfitChanged()
        resolve(response.access_token)
      },
    })

    tokenClient.requestAccessToken()
  })
}

/* ─── Disconnect ─── */
export function disconnectGoogleFit() {
  const token = getStoredToken()
  if (token && token !== 'demo-token') {
    const google = (window as any).google
    google?.accounts?.oauth2?.revoke?.(token)
  }
  clearGoogleFitData()
  dispatchGfitChanged()
}

/* ─── Internal: Fetch Aggregate ─── */
async function fetchAggregate(token: string, dataTypeName: string, startMs: number, endMs: number) {
  const res = await fetch(`${FITNESS_API}/dataset:aggregate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName }],
      bucketByTime: { durationMillis: endMs - startMs },
      startTimeMillis: startMs,
      endTimeMillis: endMs,
    }),
  })

  if (!res.ok) {
    if (res.status === 401) {
      clearGoogleFitData()
      throw new Error('Token expired')
    }
    throw new Error(`Fitness API error: ${res.status}`)
  }

  return res.json()
}

/* ─── Internal: Fetch Sleep Sessions ─── */
async function fetchSleepHours(token: string): Promise<number | null> {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  yesterday.setHours(18, 0, 0, 0) // 6 PM yesterday

  const startIso = yesterday.toISOString()
  const endIso   = now.toISOString()

  try {
    const res = await fetch(
      `${FITNESS_API}/sessions?startTime=${startIso}&endTime=${endIso}&activityType=72`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return null
    const data = await res.json()

    let totalMs = 0
    for (const session of (data.session || [])) {
      const s = parseInt(session.startTimeMillis)
      const e = parseInt(session.endTimeMillis)
      if (!isNaN(s) && !isNaN(e)) totalMs += (e - s)
    }
    return totalMs > 0 ? Math.round((totalMs / 3_600_000) * 10) / 10 : null
  } catch {
    return null
  }
}

/* ─── Internal: Generate Demo Data ─── */
function generateDemoData(steps: number): Pick<FitData, 'screenTimeMinutes' | 'lateNightMinutes'> {
  // Seed from today's date so data stays consistent within the same day
  const seed = new Date().getDate() + new Date().getMonth() * 31
  const pseudo = (n: number) => ((seed * 9301 + n * 49297 + 233) % 1000) / 1000

  const screenTimeMinutes = Math.round(120 + pseudo(1) * 300) // 2h – 7h
  const lateNightMinutes  = Math.round(pseudo(2) * 90)        // 0m – 90m
  return { screenTimeMinutes, lateNightMinutes }
}

/* ─── Public: Fetch All Fit Data ─── */
export async function fetchFitData(token?: string | null): Promise<FitData> {
  const accessToken = token || getStoredToken()
  if (!accessToken) throw new Error('Not connected')

  // Demo mode — return simulated data
  if (accessToken === 'demo-token') {
    const seed = new Date().getDate()
    const steps = 3000 + ((seed * 7919) % 9001)          // 3k – 12k
    const sleepHours = 5 + ((seed * 3571) % 40) / 10     // 5h – 9h
    const screenTimeMinutes = 120 + ((seed * 9301) % 301) // 2h – 7h
    const lateNightMinutes  = (seed * 4973) % 91          // 0m – 90m

    const fitData: FitData = {
      steps,
      sleepHours,
      screenTimeMinutes,
      lateNightMinutes,
      lastSynced: new Date().toISOString(),
    }
    localStorage.setItem(DATA_KEY, JSON.stringify(fitData))
    return fitData
  }

  const now = Date.now()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const startMs = startOfDay.getTime()

  // Fetch steps and sleep in parallel
  const [stepsRes, sleepHoursRes] = await Promise.allSettled([
    fetchAggregate(accessToken, 'com.google.step_count.delta', startMs, now),
    fetchSleepHours(accessToken),
  ])

  // Parse steps
  let steps = 0
  if (stepsRes.status === 'fulfilled') {
    const buckets = stepsRes.value?.bucket || []
    for (const bucket of buckets) {
      for (const ds of bucket.dataset || []) {
        for (const pt of ds.point || []) {
          steps += pt.value?.[0]?.intVal || 0
        }
      }
    }
  }

  // Sleep
  const sleepHours = sleepHoursRes.status === 'fulfilled' ? sleepHoursRes.value : null

  // Screen time & late-night: simulated (no Google Fit API for these)
  const { screenTimeMinutes, lateNightMinutes } = generateDemoData(steps)

  const fitData: FitData = {
    steps,
    sleepHours,
    screenTimeMinutes,
    lateNightMinutes,
    lastSynced: new Date().toISOString(),
  }

  localStorage.setItem(DATA_KEY, JSON.stringify(fitData))
  return fitData
}
