/**
 * Spiral Risk Assessment Engine
 * Ported from Flutter's spiral_engine.dart
 * 
 * Multi-signal spiral risk assessment. Takes journal entries directly
 * and correlates them with health data. All processing is 100% on-device.
 */

import type { JournalEntry } from './storage';
import type { DailyBehavioralRecord } from './behavioralDataStore';

export interface SpiralSignal {
  type: string;
  points: number;
  description: string;
}

export interface SpiralRiskResult {
  score: number;
  signals: SpiralSignal[];
  shouldAlert: boolean;
  gentleMessage: string;
  consecutiveNegativeDays: number;
}

export function calculateRisk(
  recentEntries: JournalEntry[], 
  healthData?: Partial<DailyBehavioralRecord>
): SpiralRiskResult {
  const signals: SpiralSignal[] = [];

  // ── SIGNAL 1: Sleep degradation ──────────────────
  const sleep = healthData?.sleep_hours ?? 7.0;
  if (sleep < 5.0) {
    signals.push({ type: 'sleep', points: 30, description: 'Sleeping under 5 hours' });
  } else if (sleep < 6.5) {
    signals.push({ type: 'sleep', points: 15, description: 'Sleep below average' });
  }

  // ── SIGNAL 2: Physical withdrawal (steps) ────────
  const steps = healthData?.steps ?? 5000;
  if (steps < 2000) {
    signals.push({ type: 'mobility', points: 20, description: 'Very low movement today' });
  } else if (steps < 4000) {
    signals.push({ type: 'mobility', points: 10, description: 'Below normal activity' });
  }

  // ── SIGNAL 3: Resting heart rate (if available) ──
  // Note: healthData doesn't currently store resting HR in the web version,
  // but we leave this here for future parity if it gets added.
  const rhr = (healthData as any)?.resting_heart_rate as number | undefined;
  if (rhr !== undefined && rhr > 90) {
    signals.push({ type: 'heart_rate', points: 10, description: 'Elevated resting heart rate' });
  } else if (rhr !== undefined && rhr > 80) {
    signals.push({ type: 'heart_rate', points: 5, description: 'Slightly elevated heart rate' });
  }

  // ── SIGNAL 4: Consecutive negative emotion days ──
  const sortedEntries = [...recentEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  let consecutiveNegDays = 0;
  let lastDate: Date | null = null;
  
  for (const entry of sortedEntries.slice(0, 14)) {
    const entryTimestamp = new Date(entry.timestamp);
    const entryDate = new Date(entryTimestamp.getFullYear(), entryTimestamp.getMonth(), entryTimestamp.getDate());
    
    if (lastDate !== null) {
      const diffTime = Math.abs(lastDate.getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 1) break;
    }

    const emotion = (entry.detectedEmotion || entry.emotion || '').toLowerCase();
    const negativeEmotions = ['sadness', 'anger', 'apprehension', 'fatigue', 'stress', 'anxious']; // Included web labels
    
    if (negativeEmotions.includes(emotion)) {
      consecutiveNegDays++;
      lastDate = entryDate;
    } else {
      break;
    }
  }

  if (consecutiveNegDays >= 7) {
    signals.push({ type: 'emotion_streak', points: 35, description: `${consecutiveNegDays} consecutive difficult days` });
  } else if (consecutiveNegDays >= 4) {
    signals.push({ type: 'emotion_streak', points: 20, description: `${consecutiveNegDays} days of emotional weight` });
  }

  // ── SIGNAL 5: Word count shrinkage (emotional shutdown) ──
  if (sortedEntries.length >= 6) {
    const recentAvg = sortedEntries.slice(0, 3)
      .map(e => e.text.split(/\s+/).length)
      .reduce((a, b) => a + b, 0) / 3.0;
      
    const priorAvg = sortedEntries.slice(3, 6)
      .map(e => e.text.split(/\s+/).length)
      .reduce((a, b) => a + b, 0) / 3.0;

    if (priorAvg > 5 && (recentAvg / priorAvg) < 0.5) {
      signals.push({ type: 'word_count', points: 15, description: 'Entries getting significantly shorter' });
    }
  }

  // ── SIGNAL 6: Late-night journaling pattern ──────
  const lateNight = sortedEntries.slice(0, 7)
    .filter(e => {
      const h = new Date(e.timestamp).getHours();
      return h >= 1 && h <= 4;
    }).length;
    
  if (lateNight >= 3) {
    signals.push({ type: 'late_night', points: 15, description: 'Journaling late at night repeatedly' });
  }

  // ── SIGNAL 7: Journaling silence (withdrawal gap) ─
  if (sortedEntries.length > 0) {
    const sortedLatest = new Date(sortedEntries[0].timestamp);
    const daysSince = Math.floor((Date.now() - sortedLatest.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 5) {
      signals.push({ type: 'silence', points: 15, description: `${daysSince} day journaling gap` });
    }
  }

  // ── SIGNAL 8: Contemplation/numbness cluster ──────
  const contemplationCount = sortedEntries.slice(0, 7)
    .filter(e => {
      const em = (e.detectedEmotion || e.emotion || '').toLowerCase();
      // "contemplation" maps to surprise neutrally in web, but we'll include 'neutral' 
      return em === 'contemplation' || em === 'neutral';
    }).length;
    
  if (contemplationCount >= 4) {
    signals.push({ type: 'numbness', points: 10, description: 'High rate of emotionally neutral entries' });
  }

  // ── SIGNAL 9: Intensity score decline ───────────
  // Note: Flutter expects a discrete intensityScore > 0, we use numeric intensity
  const intensityScores = sortedEntries.slice(0, 7)
    .filter(e => e.intensity > 0)
    .map(e => Math.abs(e.intensity)); // Absolute magnitude
    
  if (intensityScores.length >= 4) {
    const recentAvg = intensityScores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const priorAvg = intensityScores.slice(2, 4).reduce((a, b) => a + b, 0) / 2;
    if (priorAvg > 0 && (recentAvg / priorAvg) < 0.6) {
      signals.push({ type: 'vibe_decline', points: 15, description: 'Daily mood score has dropped significantly' });
    }
  }

  const totalScore = Math.min(100.0, Math.max(0.0, signals.reduce((sum, s) => sum + s.points, 0)));

  return {
    score: totalScore,
    signals,
    consecutiveNegativeDays: consecutiveNegDays,
    shouldAlert: totalScore >= 55,
    gentleMessage: buildGentleMessage(signals, consecutiveNegDays, sleep),
  };
}

/// Generates a gentle, non-clinical message for the user.
/// CRITICAL: The risk score number is NEVER shown. Only this message
/// surfaces when shouldAlert is true.
function buildGentleMessage(
  signals: SpiralSignal[],
  consecutiveDays: number,
  _sleep: number,
): string {
  if (consecutiveDays >= 7) {
    return 'You have been carrying something heavy for a while now. ' +
      'That takes real energy. You do not have to figure it all out today.' +
      ' Reaching out to someone you trust might help.';
  }
  if (consecutiveDays >= 4) {
    return 'We have noticed a few heavy days in your reflections. ' +
      'You are not alone in this. Even one small act of rest or connection ' +
      'can shift things more than it seems.';
  }
  const hasSleep = signals.some((s) => s.type === 'sleep');
  const hasMobility = signals.some((s) => s.type === 'mobility');
  const hasSilence = signals.some((s) => s.type === 'silence');
  
  if (hasSilence) {
    return 'We have missed you. Even a few words here can help you see ' +
      'your own patterns more clearly. No pressure — just here when you are ready.';
  }
  if (hasSleep && hasMobility) {
    return 'Your body might be asking for something. Even a short walk ' +
      'or an earlier bedtime can shift your emotional landscape more than it seems.';
  }
  if (hasSleep) {
    return 'Sleep below average can amplify every difficult feeling. ' +
      'What you are experiencing may be partly a body signal. Be gentle with yourself.';
  }
  return 'We have noticed some patterns worth paying attention to. ' +
    'How are you really doing today?';
}
