import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, Area, AreaChart,
} from 'recharts';
import {
  Brain, Moon, Footprints, Smartphone, AlertTriangle, TrendingUp,
  Sparkles, RefreshCw, Trash2, Plus, Activity, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { storage } from '../utils/storage';
import { behavioralDataStore } from '../utils/behavioralDataStore';
import {
  buildMoodTimeline, predictMoodFromBehavior, getLatestConflictInsight,
  generateBehavioralInsights, calculateWellnessScore,
  type DailyMoodDataPoint, type MoodPrediction, type WellnessScore,
} from '../utils/moodPredictionEngine';
import { googleFitService } from '../utils/googleFitService';
import { deviceSignalCollector, type DeviceSignals } from '../utils/deviceSignalCollector';
import MicroCheckin from '../components/MicroCheckin';

/* ── Chart Tooltips ── */
const JournalTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as DailyMoodDataPoint;
  return (
    <div className="mood-tooltip">
      <p className="mood-tooltip-date">{label}</p>
      {data?.journalMood !== null && data?.journalMood !== undefined ? (
        <>
          <p className="mood-tooltip-value" style={{ color: '#A855F7' }}>
            Mood Score: {data.journalMood}
          </p>
          {data.journalEmotion && (
            <p className="mood-tooltip-sub">Emotion: {data.journalEmotion}</p>
          )}
        </>
      ) : (
        <p className="mood-tooltip-sub">No journal entry</p>
      )}
    </div>
  );
};

const BehavioralTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as DailyMoodDataPoint;
  return (
    <div className="mood-tooltip">
      <p className="mood-tooltip-date">{label}</p>
      {data?.behavioralMood !== null && data?.behavioralMood !== undefined ? (
        <>
          <p className="mood-tooltip-value" style={{ color: '#22D3EE' }}>
            Predicted Mood: {data.behavioralMood}
          </p>
          {data.behavioralLabel && (
            <p className="mood-tooltip-sub">State: {data.behavioralLabel}</p>
          )}
          {data.sleep_hours !== undefined && (
            <p className="mood-tooltip-sub">🌙 Sleep: {data.sleep_hours}h</p>
          )}
          {data.steps !== undefined && (
            <p className="mood-tooltip-sub">👟 Steps: {data.steps.toLocaleString()}</p>
          )}
          {data.screen_time !== undefined && (
            <p className="mood-tooltip-sub">📱 Screen: {data.screen_time}h</p>
          )}
        </>
      ) : (
        <p className="mood-tooltip-sub">No behavioral data</p>
      )}
    </div>
  );
};

const ComparisonTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as DailyMoodDataPoint;
  return (
    <div className="mood-tooltip">
      <p className="mood-tooltip-date">{label}</p>
      {data?.journalMood !== null && data?.journalMood !== undefined && (
        <p className="mood-tooltip-value" style={{ color: '#A855F7' }}>
          Journal: {data.journalMood}
        </p>
      )}
      {data?.behavioralMood !== null && data?.behavioralMood !== undefined && (
        <p className="mood-tooltip-value" style={{ color: '#22D3EE' }}>
          Behavioral: {data.behavioralMood}
        </p>
      )}
    </div>
  );
};

/* ── Signal Card ── */
const SignalCard = ({ icon: Icon, label, value, unit, color, interpretation }: {
  icon: any; label: string; value: string; unit: string; color: string; interpretation: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
    <Card hoverEffect style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '12px',
          background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        <div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color, letterSpacing: '-0.03em' }}>
            {value}<span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}> {unit}</span>
          </p>
        </div>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.5)', lineHeight: 1.5 }}>{interpretation}</p>
    </Card>
  </motion.div>
);

/* ── Mood Badge ── */
const MoodBadge = ({ mood, prob }: { mood: string; prob: number }) => {
  const colors: Record<string, string> = {
    calm: '#10B981', tired: '#6366F1', stressed: '#EF4444', energetic: '#F59E0B',
  };
  const emojis: Record<string, string> = {
    calm: '😌', tired: '😴', stressed: '😰', energetic: '⚡',
  };
  const color = colors[mood] || '#6B7280';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.5rem 0.75rem', borderRadius: '12px',
      background: `${color}12`, border: `1px solid ${color}25`,
    }}>
      <span style={{ fontSize: '1.2rem' }}>{emojis[mood] || '😐'}</span>
      <div>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, color, textTransform: 'capitalize' }}>{mood}</p>
        <p style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.4)' }}>{(prob * 100).toFixed(0)}%</p>
      </div>
      {/* Mini progress */}
      <div style={{ width: 50, height: 4, borderRadius: 99, background: `${color}20`, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${prob * 100}%` }}
          transition={{ duration: 1 }}
          style={{ height: '100%', borderRadius: 99, background: color }}
        />
      </div>
    </div>
  );
};

/* ── Main Page Component ── */
const MoodPredictionPage: React.FC = () => {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<DailyMoodDataPoint[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<MoodPrediction | null>(null);
  const [conflict, setConflict] = useState<any>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [wellness, setWellness] = useState<WellnessScore | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showDataForm, setShowDataForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gfitConnected, setGfitConnected] = useState(false);
  const [gfitSyncing, setGfitSyncing] = useState(false);
  const [gfitError, setGfitError] = useState('');
  const [days, setDays] = useState(14);
  const [deviceSigs, setDeviceSigs] = useState<DeviceSignals | null>(null);
  const [autoSyncStatus, setAutoSyncStatus] = useState<string>('');

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSleep, setFormSleep] = useState(7);
  const [formSteps, setFormSteps] = useState(5000);
  const [formScreen, setFormScreen] = useState(4);

  /** Auto-sync data from all available sources */
  const autoSyncData = useCallback(async () => {
    if (!user?.id) return;
    const today = new Date().toISOString().split('T')[0];
    let synced = false;

    // 1. Try Google Fit auto-fetch (if already authenticated)
    if (googleFitService.isAuthenticated()) {
      setAutoSyncStatus('Syncing from Google Fit...');
      try {
        const fitData = await googleFitService.fetchDailyData(today);
        if (fitData.steps > 0 || fitData.sleepHours > 0) {
          const existing = behavioralDataStore.getRecordForDate(user.id, today);
          behavioralDataStore.saveRecord(user.id, {
            date: today,
            sleep_hours: fitData.sleepHours || existing?.sleep_hours || 7,
            steps: fitData.steps || existing?.steps || 0,
            screen_time: existing?.screen_time || 0,
            source: 'google_fit',
          });
          synced = true;
        }
      } catch (e) {
        console.log('Google Fit auto-sync skipped:', e);
      }
    }

    // 2. Merge device sensor data (accelerometer steps, app screen time)
    const signals = deviceSignalCollector.getSignals(user.id);
    setDeviceSigs(signals);

    if (signals.estimatedSteps > 0 || signals.appScreenTimeMinutes > 0) {
      const existing = behavioralDataStore.getRecordForDate(user.id, today);
      // Only use device steps if no Google Fit steps
      const currentSteps = existing?.steps || 0;
      const useDeviceSteps = currentSteps === 0 && signals.estimatedSteps > 0;

      if (useDeviceSteps || (!existing && signals.appScreenTimeMinutes > 0)) {
        behavioralDataStore.saveRecord(user.id, {
          date: today,
          sleep_hours: existing?.sleep_hours || 7,
          steps: useDeviceSteps ? signals.estimatedSteps : currentSteps,
          screen_time: signals.appScreenTimeMinutes > 0
            ? Math.round(signals.appScreenTimeMinutes / 60 * 10) / 10
            : (existing?.screen_time || 0),
          source: existing?.source || 'manual',
        });
        synced = true;
      }
    }

    setAutoSyncStatus(synced ? '✅ Data synced from device' : '');
    setTimeout(() => setAutoSyncStatus(''), 3000);
  }, [user?.id]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Auto-sync first
      await autoSyncData();

      const entries = await storage.getEntries(user.id);
      const records = behavioralDataStore.getAllRecords(user.id);
      const timelineData = buildMoodTimeline(entries, records, days);
      setTimeline(timelineData);

      // Get latest prediction
      const latestRecord = records[0];
      if (latestRecord) {
        setLatestPrediction(predictMoodFromBehavior(latestRecord));
      }

      // Conflict detection
      const conflictInsight = getLatestConflictInsight(entries, records);
      setConflict(conflictInsight);

      // Behavioral insights
      const behavInsights = generateBehavioralInsights(records.slice(0, 7));
      setInsights(behavInsights);

      // Summary
      const sum = behavioralDataStore.getSummary(user.id, 7);
      setSummary(sum);

      // Wellness score
      const wellnessScore = calculateWellnessScore(records.slice(0, 7));
      setWellness(wellnessScore);

      // Refresh device signals
      setDeviceSigs(deviceSignalCollector.getSignals(user.id));
    } catch (error) {
      console.error('Error loading mood prediction data:', error);
    }

    setLoading(false);
  }, [user?.id, days, autoSyncData]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-sync when returning from mobile OAuth redirect
  useEffect(() => {
    if (googleFitService.justAuthenticated && googleFitService.isAuthenticated()) {
      setGfitConnected(true);
      googleFitService.justAuthenticated = false; // Reset flag
      // Auto-fetch data after redirect
      (async () => {
        setGfitSyncing(true);
        const today = new Date().toISOString().split('T')[0];
        const data = await googleFitService.fetchDailyData(today);
        if (user?.id && (data.steps > 0 || data.sleepHours > 0)) {
          behavioralDataStore.saveRecord(user.id, {
            date: today,
            sleep_hours: data.sleepHours || formSleep,
            steps: data.steps || formSteps,
            screen_time: formScreen,
            source: 'google_fit',
          });
          loadData();
        }
        setGfitSyncing(false);
      })();
    }
  }, []);

  const handleManualSubmit = () => {
    if (!user?.id) return;
    behavioralDataStore.saveRecord(user.id, {
      date: formDate,
      sleep_hours: formSleep,
      steps: formSteps,
      screen_time: formScreen,
      source: 'manual',
    });
    setShowDataForm(false);
    loadData();
  };

  const handleGoogleFitConnect = async () => {
    setGfitSyncing(true);
    setGfitError('');
    const result = await googleFitService.signIn();
    if (result.success) {
      setGfitConnected(true);
      // Fetch today's data
      const today = new Date().toISOString().split('T')[0];
      const data = await googleFitService.fetchDailyData(today);
      if (user?.id && (data.steps > 0 || data.sleepHours > 0)) {
        behavioralDataStore.saveRecord(user.id, {
          date: today,
          sleep_hours: data.sleepHours || formSleep,
          steps: data.steps || formSteps,
          screen_time: formScreen,
          source: 'google_fit',
        });
        loadData();
      }
    } else {
      setGfitError(result.error?.message || 'Failed to connect to Google Fit. Please try again.');
    }
    setGfitSyncing(false);
  };

  const handleMotionPermission = async () => {
    const granted = await deviceSignalCollector.requestMotionPermission();
    if (granted && user?.id) {
      deviceSignalCollector.startMotionTracking(user.id);
    }
  };

  const handleClearData = () => {
    if (!user?.id) return;
    if (confirm('Delete all behavioral data? This cannot be undone.')) {
      behavioralDataStore.clearAllData(user.id);
      loadData();
    }
  };

  const getSleepInterpretation = (hours: number) => {
    if (hours < 5) return 'Very low — strongly linked to stress & fatigue';
    if (hours < 6) return 'Below optimal — may impact mood';
    if (hours <= 9) return 'Healthy range — supports emotional balance';
    return 'Above typical — may indicate low energy';
  };

  const getStepsInterpretation = (steps: number) => {
    if (steps < 2000) return 'Very low activity — associated with lower mood';
    if (steps < 5000) return 'Below average — some movement is better than none';
    if (steps < 8000) return 'Average activity — good baseline';
    return 'Active lifestyle — strongly linked to better mood';
  };

  const getScreenInterpretation = (hours: number) => {
    if (hours > 10) return 'Very high — strongly associated with stress';
    if (hours > 7) return 'Above average — may contribute to fatigue';
    if (hours > 4) return 'Moderate usage — within typical range';
    return 'Low usage — associated with calmer states';
  };

  // Filter timeline for charts (only points with data)
  const journalData = timeline.filter(p => p.journalMood !== null);
  const behavioralData = timeline.filter(p => p.behavioralMood !== null);
  const comparisonData = timeline.filter(p => p.journalMood !== null || p.behavioralMood !== null);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>
        <div style={{ textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Brain size={32} style={{ color: '#A855F7', marginBottom: '1rem' }} />
          </motion.div>
          <p>Analyzing behavioral patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Header ── */}
      <header>
        <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          Mood AI · Behavioral Analysis
        </p>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          Your <span className="text-gradient">Mood Intelligence</span>
        </h1>
        <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: '1rem', maxWidth: '600px' }}>
          Comparing self-reported emotions with behavior-based predictions powered by the Dartmouth StudentLife research model.
        </p>
      </header>

      {/* ── Action Bar ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCheckin(true)}>
          <Sparkles size={15} /> Daily Check-in
        </button>
        <button className="btn btn-glass btn-sm" onClick={() => setShowDataForm(p => !p)}>
          <Plus size={15} /> Manual Entry
        </button>
        {googleFitService.isConfigured() && !gfitConnected && (
          <button className="btn btn-glass btn-sm" onClick={handleGoogleFitConnect} disabled={gfitSyncing}>
            <Activity size={15} /> {gfitSyncing ? 'Syncing...' : 'Connect Google Fit'}
          </button>
        )}
        {gfitConnected && (
          <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Activity size={12} /> Google Fit Connected
          </span>
        )}
        {gfitError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 500 }}>
              ⚠️ {gfitError}
            </span>
            <button
              className="btn btn-glass btn-sm"
              onClick={handleGoogleFitConnect}
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
            >
              Retry
            </button>
          </div>
        )}
        <button className="btn btn-glass btn-sm" onClick={loadData}>
          <RefreshCw size={15} /> Refresh
        </button>
        {autoSyncStatus && (
          <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600, marginLeft: '0.5rem' }}>
            {autoSyncStatus}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <select
          value={days}
          onChange={e => setDays(parseInt(e.target.value))}
          style={{
            padding: '0.45rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
            border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg-card)', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <option value={7}>7 Days</option>
          <option value={14}>14 Days</option>
          <option value={30}>30 Days</option>
        </select>
      </div>

      {/* ── Live Device Sensors ── */}
      {deviceSigs && (
        <Card style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(34,211,238,0.04))',
          border: '1px solid rgba(16,185,129,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(0,0,0,0.5)' }}>
              Live Device Sensors — Auto-Detected
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div style={{ textAlign: 'center', padding: '0.5rem' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>{deviceSigs.estimatedSteps.toLocaleString()}</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>Steps (Accelerometer)</p>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366F1' }}>{deviceSigs.appScreenTimeMinutes}m</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>App Screen Time</p>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F97316', textTransform: 'capitalize' }}>{deviceSigs.motionIntensity}</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>Activity Level</p>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: deviceSigs.isLateNightUsage ? '#EF4444' : '#10B981' }}>
                {deviceSigs.isLateNightUsage ? '⚠️ Yes' : '✅ No'}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>Late Night Usage</p>
            </div>
            {deviceSigs.batteryLevel !== null && (
              <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: deviceSigs.batteryLevel < 20 ? '#EF4444' : '#10B981' }}>{deviceSigs.batteryLevel}%</p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>Battery</p>
              </div>
            )}
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-glass btn-sm" onClick={handleMotionPermission} style={{ fontSize: '0.75rem' }}>
              <Footprints size={12} /> Enable Step Tracking
            </button>
            <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.35)', alignSelf: 'center' }}>
              Step tracking requires motion sensor permission on your device
            </p>
          </div>
        </Card>
      )}

      {/* ── Manual Data Entry Form ── */}
      <AnimatePresence>
        {showDataForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} color="#A855F7" /> Manual Behavioral Data Entry
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '0.4rem' }}>Date</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="input-base" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '0.4rem' }}>Sleep Hours: {formSleep}h</label>
                  <input type="range" min="0" max="14" step="0.5" value={formSleep} onChange={e => setFormSleep(parseFloat(e.target.value))} className="checkin-range" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '0.4rem' }}>Steps: {formSteps.toLocaleString()}</label>
                  <input type="range" min="0" max="30000" step="500" value={formSteps} onChange={e => setFormSteps(parseInt(e.target.value))} className="checkin-range" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '0.4rem' }}>Screen Time: {formScreen}h</label>
                  <input type="range" min="0" max="16" step="0.5" value={formScreen} onChange={e => setFormScreen(parseFloat(e.target.value))} className="checkin-range" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-glass btn-sm" onClick={() => setShowDataForm(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleManualSubmit}>
                  Save Record
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mood Prediction State ── */}
      {latestPrediction && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.05), rgba(34,211,238,0.05))',
            border: '1px solid rgba(168,85,247,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="section-label" style={{ marginBottom: '0.5rem' }}><Brain size={13} />AI Mood Prediction</div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', textTransform: 'capitalize' }} className="text-gradient">
                  {latestPrediction.dominant}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.45)', marginTop: '0.25rem' }}>
                  Based on your latest behavioral signals (StudentLife model)
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em' }} className="text-gradient">
                  {latestPrediction.moodScore}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.4)' }}>Mood Score / 10</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <MoodBadge mood="calm" prob={latestPrediction.calm} />
              <MoodBadge mood="energetic" prob={latestPrediction.energetic} />
              <MoodBadge mood="tired" prob={latestPrediction.tired} />
              <MoodBadge mood="stressed" prob={latestPrediction.stressed} />
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Conflict Insight ── */}
      <AnimatePresence>
        {conflict?.hasConflict && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="insight-pill" style={{
              borderColor: conflict.severity === 'high' ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)',
              background: conflict.severity === 'high' ? 'rgba(239,68,68,0.06)' : 'rgba(249,115,22,0.06)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '12px',
                background: conflict.severity === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(249,115,22,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <AlertTriangle size={18} color={conflict.severity === 'high' ? '#EF4444' : '#F97316'} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                  Mood Conflict Detected
                </p>
                <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.55)', lineHeight: 1.6 }}>
                  {conflict.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Graph 1: Journal Mood Trend ── */}
      <div>
        <div className="section-label"><TrendingUp size={13} />Self-Reported Mood Trend (Journaling)</div>
        <Card>
          {journalData.length > 0 ? (
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={journalData} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="journalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="dateLabel" stroke="rgba(0,0,0,0)" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(0,0,0,0)" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} domain={[0, 10]} axisLine={false} tickLine={false} />
                  <Tooltip content={<JournalTooltip />} />
                  <ReferenceLine y={5} stroke="rgba(0,0,0,0.1)" strokeDasharray="3 3" label={{ value: 'Neutral', position: 'left', fill: 'rgba(0,0,0,0.2)', fontSize: 10 }} />
                  <Area type="monotone" dataKey="journalMood" stroke="#A855F7" strokeWidth={2.5} fill="url(#journalGrad)" />
                  <Line
                    type="monotone" dataKey="journalMood" stroke="#A855F7" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', stroke: '#A855F7', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#A855F7', strokeWidth: 0 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(0,0,0,0.35)' }}>
              <p style={{ fontWeight: 600 }}>No journal entries yet</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Write journal entries to see your self-reported mood trend</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Graph 2: Behavioral Mood Prediction ── */}
      <div>
        <div className="section-label"><Brain size={13} />Behavior-Based Mood Prediction</div>
        <Card>
          {behavioralData.length > 0 ? (
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={behavioralData} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="behavGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="dateLabel" stroke="rgba(0,0,0,0)" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(0,0,0,0)" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} domain={[0, 10]} axisLine={false} tickLine={false} />
                  <Tooltip content={<BehavioralTooltip />} />
                  <ReferenceLine y={5} stroke="rgba(0,0,0,0.1)" strokeDasharray="3 3" label={{ value: 'Neutral', position: 'left', fill: 'rgba(0,0,0,0.2)', fontSize: 10 }} />
                  <Area type="monotone" dataKey="behavioralMood" stroke="#22D3EE" strokeWidth={2.5} fill="url(#behavGrad)" />
                  <Line
                    type="monotone" dataKey="behavioralMood" stroke="#22D3EE" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', stroke: '#22D3EE', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#22D3EE', strokeWidth: 0 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(0,0,0,0.35)' }}>
              <p style={{ fontWeight: 600 }}>No behavioral data yet</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Use the Daily Check-in or Add Data button to start</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Graph 3: Mood Comparison ── */}
      <div>
        <div className="section-label"><Activity size={13} />Mood Comparison — Journal vs Behavioral</div>
        <Card>
          {comparisonData.length > 0 ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="dateLabel" stroke="rgba(0,0,0,0)" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(0,0,0,0)" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} domain={[0, 10]} axisLine={false} tickLine={false} />
                  <Tooltip content={<ComparisonTooltip />} />
                  <Legend
                    verticalAlign="top" height={36}
                    formatter={(value: string) => (
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>
                        {value === 'journalMood' ? 'Journal Mood' : 'Behavioral Mood'}
                      </span>
                    )}
                  />
                  <ReferenceLine y={5} stroke="rgba(0,0,0,0.08)" strokeDasharray="3 3" />
                  <Line
                    type="monotone" dataKey="journalMood" name="journalMood"
                    stroke="#A855F7" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', stroke: '#A855F7', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#A855F7', strokeWidth: 0 }}
                    connectNulls
                  />
                  <Line
                    type="monotone" dataKey="behavioralMood" name="behavioralMood"
                    stroke="#22D3EE" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', stroke: '#22D3EE', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#22D3EE', strokeWidth: 0 }}
                    connectNulls strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(0,0,0,0.35)' }}>
              <p style={{ fontWeight: 600 }}>Add journal entries and behavioral data to compare</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Wellness Score Card ── */}
      {wellness && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-label"><Sparkles size={13} />Weekly Wellness Score</div>
          <Card style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.04), rgba(16,185,129,0.04))',
            border: '1px solid rgba(168,85,247,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Grade circle */}
              <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={wellness.overall >= 70 ? '#10B981' : wellness.overall >= 50 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${wellness.overall * 2.64} 264`}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.05em',
                    color: wellness.overall >= 70 ? '#10B981' : wellness.overall >= 50 ? '#F59E0B' : '#EF4444',
                  }}>{wellness.grade}</span>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>{wellness.overall}/100</span>
                </div>
              </div>

              {/* Sub-scores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem 1.5rem', flex: 1 }}>
                {[
                  { label: '🌙 Sleep', score: wellness.sleep },
                  { label: '🏃 Activity', score: wellness.activity },
                  { label: '📱 Screen Balance', score: wellness.screenBalance },
                  { label: '📊 Consistency', score: wellness.consistency },
                ].map(({ label, score }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)' }}>{label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444' }}>{score}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${score}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        style={{ height: '100%', borderRadius: 99,
                          background: score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Trend */}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <p style={{ fontSize: '1.5rem' }}>
                  {wellness.trend === 'improving' ? '📈' : wellness.trend === 'declining' ? '📉' : '➡️'}
                </p>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
                  color: wellness.trend === 'improving' ? '#10B981' : wellness.trend === 'declining' ? '#EF4444' : 'rgba(0,0,0,0.4)',
                }}>{wellness.trend}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Signal Breakdown Cards ── */}
      {summary && summary.totalRecords > 0 && (
        <div>
          <div className="section-label"><Activity size={13} />Behavioral Signal Breakdown (7-Day Avg)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <SignalCard
              icon={Moon} label="Sleep" value={summary.avgSleep.toFixed(1)} unit="hrs/night"
              color="#6366F1" interpretation={getSleepInterpretation(summary.avgSleep)}
            />
            <SignalCard
              icon={Footprints} label="Daily Steps" value={summary.avgSteps.toLocaleString()} unit="avg"
              color="#10B981" interpretation={getStepsInterpretation(summary.avgSteps)}
            />
            <SignalCard
              icon={Smartphone} label="Screen Time" value={summary.avgScreenTime.toFixed(1)} unit="hrs/day"
              color="#F97316" interpretation={getScreenInterpretation(summary.avgScreenTime)}
            />
          </div>
        </div>
      )}

      {/* ── StudentLife AI Insights ── */}
      {insights.length > 0 && (
        <div>
          <div className="section-label"><Sparkles size={13} />StudentLife AI Insights</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {insights.map((ins, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <div className="insight-pill" style={{
                  borderColor: 'rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.04)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '10px', background: 'rgba(168,85,247,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Brain size={16} color="#A855F7" />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)', lineHeight: 1.6 }}>{ins}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Privacy & Data Controls ── */}
      <Card style={{ background: 'rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={18} color="#10B981" />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Privacy Controls</p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.45)' }}>
                All behavioral data is stored locally on your device. No content is ever read.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-glass btn-sm" onClick={handleClearData} style={{ color: '#EF4444' }}>
              <Trash2 size={14} /> Clear All Data
            </button>
          </div>
        </div>
      </Card>

      {/* ── Micro Check-in Modal ── */}
      <AnimatePresence>
        {showCheckin && user && (
          <MicroCheckin
            userId={user.id}
            onClose={() => setShowCheckin(false)}
            onComplete={() => {
              setShowCheckin(false);
              loadData();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MoodPredictionPage;
