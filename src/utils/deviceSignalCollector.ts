/**
 * Device Signal Collector
 * 
 * Automatically collects behavioral signals from the device using Web APIs.
 * No user input required — runs silently in the background.
 * 
 * Signals collected:
 * - Activity/motion level via Accelerometer (DeviceMotion API)
 * - Screen time on MannMitra via Page Visibility API
 * - Late-night usage detection via timestamps
 * - Estimated step count from motion intensity
 * - Battery level pattern (optional)
 */

/* ── Types ── */
export interface DeviceSignals {
  estimatedSteps: number;          // Estimated from accelerometer
  activeMinutes: number;           // Minutes of detected movement
  appScreenTimeMinutes: number;    // Minutes spent on MannMitra today
  isLateNightUsage: boolean;       // Usage between 12am-5am
  motionIntensity: 'sedentary' | 'light' | 'moderate' | 'active';
  batteryLevel: number | null;     // 0-100 or null
  lastUpdated: string;
}

/* ── Storage keys ── */
const SIGNALS_KEY = (userId: string) => `mannmitra_device_signals_${userId}`;
const SESSION_START_KEY = () => `mannmitra_session_start`;
const DAILY_SCREEN_KEY = (userId: string) => `mannmitra_screen_time_${userId}`;
const STEP_BUFFER_KEY = () => `mannmitra_step_buffer`;

/* ── Motion tracking state ── */
let motionListener: ((e: DeviceMotionEvent) => void) | null = null;
let motionSamples: number[] = [];
let isTracking = false;
let visibilityHandler: (() => void) | null = null;

/* ── Constants from research ── */
// Average stride accelerometer threshold (m/s²)
const STEP_THRESHOLD = 1.2;
// Samples per step estimation cycle
const SAMPLE_WINDOW = 50;

/* ── Core API ── */
export const deviceSignalCollector = {

  /**
   * Start all background signal collection.
   * Call this once when the app loads (in Layout.tsx).
   */
  startCollection: (userId: string): void => {
    if (isTracking) return;
    isTracking = true;

    // Record session start
    if (!sessionStorage.getItem(SESSION_START_KEY())) {
      sessionStorage.setItem(SESSION_START_KEY(), new Date().toISOString());
    }

    // Start motion tracking
    deviceSignalCollector.startMotionTracking(userId);

    // Start screen time tracking
    deviceSignalCollector.startScreenTimeTracking(userId);

    // Check battery
    deviceSignalCollector.checkBattery(userId);

    // Check late night
    deviceSignalCollector.checkLateNightUsage(userId);

    console.log('📊 Device signal collection started');
  },

  /**
   * Stop all collection.
   */
  stopCollection: (): void => {
    isTracking = false;

    // Remove motion listener
    if (motionListener) {
      window.removeEventListener('devicemotion', motionListener);
      motionListener = null;
    }

    // Remove visibility listener
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }

    motionSamples = [];
    console.log('📊 Device signal collection stopped');
  },

  /**
   * Start accelerometer-based motion tracking.
   * Estimates steps and activity level from device motion.
   */
  startMotionTracking: (userId: string): void => {
    // Check if DeviceMotion is available
    if (!('DeviceMotionEvent' in window)) {
      console.log('DeviceMotion not available — skipping motion tracking');
      return;
    }

    // On iOS 13+, need to request permission
    const requestPermission = async () => {
      try {
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission !== 'granted') {
            console.log('Motion permission denied');
            return false;
          }
        }
        return true;
      } catch {
        return true; // Non-iOS, no permission needed
      }
    };

    requestPermission().then(granted => {
      if (!granted) return;

      let stepCount = 0;
      let lastMagnitude = 0;
      let aboveThreshold = false;
      const today = new Date().toISOString().split('T')[0];

      // Load existing step count for today
      const buffer = localStorage.getItem(STEP_BUFFER_KEY());
      if (buffer) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.date === today) {
            stepCount = parsed.steps || 0;
          }
        } catch { /* ignore */ }
      }

      motionListener = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

        // Calculate magnitude of acceleration
        const magnitude = Math.sqrt(
          (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2
        );

        // Remove gravity (~9.8 m/s²) to get user acceleration
        const userAccel = Math.abs(magnitude - 9.8);

        // Collect samples for activity analysis
        motionSamples.push(userAccel);
        if (motionSamples.length > 500) {
          motionSamples = motionSamples.slice(-500);
        }

        // Step detection using peak detection
        if (userAccel > STEP_THRESHOLD && !aboveThreshold && userAccel > lastMagnitude) {
          aboveThreshold = true;
          stepCount++;

          // Save periodically (every 10 steps)
          if (stepCount % 10 === 0) {
            localStorage.setItem(STEP_BUFFER_KEY(), JSON.stringify({
              date: today,
              steps: stepCount
            }));
            deviceSignalCollector.updateSignals(userId, { estimatedSteps: stepCount });
          }
        } else if (userAccel < STEP_THRESHOLD * 0.6) {
          aboveThreshold = false;
        }
        lastMagnitude = userAccel;

        // Update activity level periodically
        if (motionSamples.length >= SAMPLE_WINDOW && motionSamples.length % SAMPLE_WINDOW === 0) {
          const recentSamples = motionSamples.slice(-SAMPLE_WINDOW);
          const avgAccel = recentSamples.reduce((a, b) => a + b, 0) / recentSamples.length;
          
          let motionIntensity: DeviceSignals['motionIntensity'] = 'sedentary';
          let activeMinutes = 0;

          if (avgAccel > 3.0) {
            motionIntensity = 'active';
            activeMinutes = Math.round(motionSamples.length / 60); // rough estimate
          } else if (avgAccel > 1.5) {
            motionIntensity = 'moderate';
            activeMinutes = Math.round(motionSamples.length / 120);
          } else if (avgAccel > 0.5) {
            motionIntensity = 'light';
            activeMinutes = Math.round(motionSamples.length / 180);
          }

          deviceSignalCollector.updateSignals(userId, { motionIntensity, activeMinutes });
        }
      };

      window.addEventListener('devicemotion', motionListener);
    });
  },

  /**
   * Track time spent on MannMitra using Page Visibility API.
   */
  startScreenTimeTracking: (userId: string): void => {
    const today = new Date().toISOString().split('T')[0];
    
    // Load existing screen time for today
    let totalMs = 0;
    const stored = localStorage.getItem(DAILY_SCREEN_KEY(userId));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          totalMs = parsed.totalMs || 0;
        }
      } catch { /* ignore */ }
    }

    let visibleSince = document.hidden ? null : Date.now();

    visibilityHandler = () => {
      if (document.hidden) {
        // Going hidden — record time
        if (visibleSince) {
          totalMs += Date.now() - visibleSince;
          visibleSince = null;
          // Save
          localStorage.setItem(DAILY_SCREEN_KEY(userId), JSON.stringify({
            date: today,
            totalMs,
          }));
          deviceSignalCollector.updateSignals(userId, {
            appScreenTimeMinutes: Math.round(totalMs / 60000),
          });
        }
      } else {
        // Becoming visible
        visibleSince = Date.now();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    // Also save periodically while visible (every 30s)
    setInterval(() => {
      if (visibleSince && !document.hidden) {
        const currentTotal = totalMs + (Date.now() - visibleSince);
        localStorage.setItem(DAILY_SCREEN_KEY(userId), JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          totalMs: currentTotal,
        }));
        deviceSignalCollector.updateSignals(userId, {
          appScreenTimeMinutes: Math.round(currentTotal / 60000),
        });
      }
    }, 30000);
  },

  /**
   * Check battery level.
   */
  checkBattery: async (userId: string): Promise<void> => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        deviceSignalCollector.updateSignals(userId, {
          batteryLevel: Math.round(battery.level * 100),
        });
      }
    } catch {
      // Battery API not supported
    }
  },

  /**
   * Detect late-night usage (12am-5am).
   */
  checkLateNightUsage: (userId: string): void => {
    const hour = new Date().getHours();
    const isLateNight = hour >= 0 && hour < 5;
    deviceSignalCollector.updateSignals(userId, { isLateNightUsage: isLateNight });
  },

  /**
   * Update stored signals (merge with existing).
   */
  updateSignals: (userId: string, partial: Partial<DeviceSignals>): void => {
    const existing = deviceSignalCollector.getSignals(userId);
    const updated: DeviceSignals = {
      ...existing,
      ...partial,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(SIGNALS_KEY(userId), JSON.stringify(updated));
  },

  /**
   * Get current device signals.
   */
  getSignals: (userId: string): DeviceSignals => {
    try {
      const raw = localStorage.getItem(SIGNALS_KEY(userId));
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }

    return {
      estimatedSteps: 0,
      activeMinutes: 0,
      appScreenTimeMinutes: 0,
      isLateNightUsage: false,
      motionIntensity: 'sedentary',
      batteryLevel: null,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Get today's estimated step count from accelerometer.
   */
  getTodaySteps: (): number => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const buffer = localStorage.getItem(STEP_BUFFER_KEY());
      if (buffer) {
        const parsed = JSON.parse(buffer);
        if (parsed.date === today) return parsed.steps || 0;
      }
    } catch { /* ignore */ }
    return 0;
  },

  /**
   * Request motion permission (needed on iOS).
   * Call this from a user gesture (button click).
   */
  requestMotionPermission: async (): Promise<boolean> => {
    try {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const result = await (DeviceMotionEvent as any).requestPermission();
        return result === 'granted';
      }
      return true; // No permission needed (Android/desktop)
    } catch {
      return false;
    }
  },
};
