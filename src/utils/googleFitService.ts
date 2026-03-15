/**
 * Google Fit REST API Service (Optional)
 * 
 * Fetches step count and sleep data from Google Fit.
 * Requires: VITE_GOOGLE_FIT_CLIENT_ID in .env
 * 
 * This is OPTIONAL — the app works without it using manual data entry.
 * Google Fit API is FREE to use (no billing required).
 * 
 * On MOBILE: Uses redirect-based OAuth (implicit grant flow).
 * On DESKTOP: Uses popup-based OAuth via Google Identity Services.
 */

/* ── Types ── */
export interface GoogleFitData {
  steps: number;
  sleepHours: number;
  date: string;
}

export interface GoogleFitError {
  code: 'not_configured' | 'gis_not_loaded' | 'auth_failed' | 'token_expired' | 'fetch_error' | 'popup_blocked';
  message: string;
}

/* ── Configuration ── */
const GOOGLE_FIT_CLIENT_ID = import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID || '';
const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
].join(' ');

/* ── Mobile Detection ── */
const isMobileBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
};

/* ── State ── */
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/* ── Persist token in sessionStorage for redirect flow ── */
const TOKEN_STORAGE_KEY = 'gfit_access_token';
const EXPIRY_STORAGE_KEY = 'gfit_token_expiry';

function saveTokenToStorage(token: string, expiry: number) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(EXPIRY_STORAGE_KEY, String(expiry));
  } catch { /* ignore */ }
}

function loadTokenFromStorage() {
  try {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = sessionStorage.getItem(EXPIRY_STORAGE_KEY);
    if (token && expiry) {
      const exp = parseInt(expiry);
      if (Date.now() < exp) {
        accessToken = token;
        tokenExpiry = exp;
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(EXPIRY_STORAGE_KEY);
      }
    }
  } catch { /* ignore */ }
}

// Load token on module init (picks up token saved before redirect)
loadTokenFromStorage();

/* ── Helper: Check token validity ── */
function isTokenValid(): boolean {
  return !!accessToken && Date.now() < tokenExpiry;
}

/* ── Redirect OAuth helpers ── */
function buildRedirectAuthUrl(): string {
  const redirectUri = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    client_id: GOOGLE_FIT_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Call this on app startup to check if we're returning from a Google OAuth redirect.
 * Extracts the access_token from the URL hash fragment and stores it.
 * Returns true if a token was found and processed.
 */
function handleRedirectCallback(): boolean {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token')) return false;

  const params = new URLSearchParams(hash.substring(1)); // remove '#'
  const token = params.get('access_token');
  const expiresIn = params.get('expires_in');

  if (token) {
    accessToken = token;
    tokenExpiry = Date.now() + (parseInt(expiresIn || '3600') * 1000);
    saveTokenToStorage(accessToken, tokenExpiry);

    // Clean up the URL hash so it doesn't look messy
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  }

  // Check for error in redirect
  const error = params.get('error');
  if (error) {
    console.error('Google OAuth redirect error:', error);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  return false;
}

// Auto-handle redirect callback on module load
const redirectHandled = handleRedirectCallback();

/* ── Public API ── */
export const googleFitService = {

  /** Whether a redirect callback was just processed (use to auto-sync) */
  justAuthenticated: redirectHandled,

  /** Check if Google Fit credentials are configured */
  isConfigured: (): boolean => {
    return !!GOOGLE_FIT_CLIENT_ID && GOOGLE_FIT_CLIENT_ID !== '';
  },

  /** Check if currently authenticated with valid token */
  isAuthenticated: (): boolean => {
    return isTokenValid();
  },

  /** Get last error message for display */
  getConnectionStatus: (): { connected: boolean; message: string } => {
    if (!googleFitService.isConfigured()) {
      return { connected: false, message: 'Google Fit Client ID not configured' };
    }
    if (!accessToken) {
      return { connected: false, message: 'Not connected — tap to sign in' };
    }
    if (!isTokenValid()) {
      return { connected: false, message: 'Session expired — tap to reconnect' };
    }
    return { connected: true, message: 'Connected to Google Fit ✓' };
  },

  /**
   * Initiate Google OAuth sign-in for Fit data access.
   * On mobile: uses redirect-based implicit grant flow.
   * On desktop: uses popup-based Google Identity Services.
   */
  signIn: (): Promise<{ success: boolean; error?: GoogleFitError }> => {
    return new Promise((resolve) => {
      if (!googleFitService.isConfigured()) {
        resolve({
          success: false,
          error: {
            code: 'not_configured',
            message: 'Google Fit is not configured. Add VITE_GOOGLE_FIT_CLIENT_ID to your .env file.',
          },
        });
        return;
      }

      // ── MOBILE: Use redirect-based OAuth ──
      if (isMobileBrowser()) {
        // Redirect the user to Google's OAuth page
        // They'll come back with token in the URL hash
        window.location.href = buildRedirectAuthUrl();
        // This promise won't resolve because the page navigates away
        return;
      }

      // ── DESKTOP: Use popup-based OAuth ──
      try {
        const google = (window as any).google;
        if (!google?.accounts?.oauth2) {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.onload = () => {
            setTimeout(() => {
              googleFitService.signIn().then(resolve);
            }, 500);
          };
          script.onerror = () => {
            resolve({
              success: false,
              error: {
                code: 'gis_not_loaded',
                message: 'Could not load Google Sign-In. Check your internet connection and try again.',
              },
            });
          };
          document.head.appendChild(script);
          return;
        }

        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_FIT_CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error) {
              resolve({
                success: false,
                error: {
                  code: response.error === 'popup_blocked_by_browser' ? 'popup_blocked' : 'auth_failed',
                  message: response.error === 'popup_blocked_by_browser'
                    ? 'Pop-up was blocked. Please allow pop-ups for this site and try again.'
                    : `Authentication failed: ${response.error}. Please try again.`,
                },
              });
              return;
            }
            if (response.access_token) {
              accessToken = response.access_token;
              tokenExpiry = Date.now() + (response.expires_in || 3600) * 1000;
              saveTokenToStorage(accessToken!, tokenExpiry);
              resolve({ success: true });
            } else {
              resolve({
                success: false,
                error: {
                  code: 'auth_failed',
                  message: 'Sign-in was cancelled or no token was received. Please try again.',
                },
              });
            }
          },
          error_callback: (err: any) => {
            resolve({
              success: false,
              error: {
                code: err?.type === 'popup_closed' ? 'auth_failed' : 'popup_blocked',
                message: err?.type === 'popup_closed'
                  ? 'Sign-in window was closed. Please try again.'
                  : 'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
              },
            });
          },
        });

        tokenClient.requestAccessToken();
      } catch (error) {
        console.error('Google Fit sign-in error:', error);
        resolve({
          success: false,
          error: {
            code: 'auth_failed',
            message: `Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          },
        });
      }
    });
  },

  /** Sign out and clear token */
  signOut: (): void => {
    accessToken = null;
    tokenExpiry = 0;
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(EXPIRY_STORAGE_KEY);
    } catch { /* ignore */ }
  },

  /**
   * Fetch step count for a given date.
   */
  fetchSteps: async (date: string): Promise<number> => {
    if (!isTokenValid()) return 0;

    const startTime = new Date(`${date}T00:00:00`).getTime();
    const endTime = new Date(`${date}T23:59:59`).getTime();

    try {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime,
          endTimeMillis: endTime,
        }),
      });

      if (response.status === 401) {
        accessToken = null;
        tokenExpiry = 0;
        return 0;
      }
      if (!response.ok) return 0;
      const data = await response.json();
      const bucket = data.bucket?.[0];
      const dataset = bucket?.dataset?.[0];
      const point = dataset?.point?.[0];
      return point?.value?.[0]?.intVal || 0;
    } catch (error) {
      console.error('Google Fit steps fetch error:', error);
      return 0;
    }
  },

  /**
   * Fetch sleep duration for a given date.
   */
  fetchSleepHours: async (date: string): Promise<number> => {
    if (!isTokenValid()) return 0;

    const startTime = new Date(`${date}T00:00:00`).getTime() - 12 * 3600000;
    const endTime = new Date(`${date}T23:59:59`).getTime();

    try {
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(startTime).toISOString()}&endTime=${new Date(endTime).toISOString()}&activityType=72`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      if (response.status === 401) {
        accessToken = null;
        tokenExpiry = 0;
        return 0;
      }
      if (!response.ok) return 0;
      const data = await response.json();

      let totalSleepMs = 0;
      for (const session of (data.session || [])) {
        const sessionStart = parseInt(session.startTimeMillis);
        const sessionEnd = parseInt(session.endTimeMillis);
        totalSleepMs += (sessionEnd - sessionStart);
      }

      return Math.round((totalSleepMs / 3600000) * 10) / 10;
    } catch (error) {
      console.error('Google Fit sleep fetch error:', error);
      return 0;
    }
  },

  /**
   * Fetch all available data for a specific date.
   */
  fetchDailyData: async (date: string): Promise<GoogleFitData> => {
    // Auto-refresh if token expired
    if (!isTokenValid() && accessToken) {
      console.log('Token expired, need re-authentication');
      accessToken = null;
      tokenExpiry = 0;
    }

    const [steps, sleepHours] = await Promise.all([
      googleFitService.fetchSteps(date),
      googleFitService.fetchSleepHours(date),
    ]);
    return { steps, sleepHours, date };
  },

  /**
   * Fetch data for a range of dates.
   */
  fetchRangeData: async (dates: string[]): Promise<GoogleFitData[]> => {
    const results: GoogleFitData[] = [];
    for (const date of dates) {
      const data = await googleFitService.fetchDailyData(date);
      results.push(data);
    }
    return results;
  },
};
