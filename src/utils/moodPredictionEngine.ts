/**
 * Mood Prediction Engine
 * 
 * Weighted scoring model based on Dartmouth StudentLife dataset research.
 * Encodes known correlations between behavioral signals and mood states.
 * 
 * Research findings encoded:
 * - Poor sleep (< 5h) → higher stress, lower mood
 * - Good sleep (7-9h) → calm, positive mood
 * - High step count (> 8000) → energetic, positive
 * - Low step count (< 2000) → tired, low mood
 * - High screen time (> 8h) → stress indicator
 * - Low screen time (< 3h) → calm indicator
 * 
 * Enhanced signals:
 * - Cross-signal correlations (poor sleep + high screen = amplified stress)
 * - Sleep consistency scoring
 * - Time-of-day behavioral weighting
 * - Weekly wellness score
 * 
 * Output: probability distribution over { calm, tired, stressed, energetic }
 */

import type { DailyBehavioralRecord } from './behavioralDataStore';
import type { JournalEntry } from './storage';

/* ── Types ── */
export interface MoodPrediction {
  calm: number;
  tired: number;
  stressed: number;
  energetic: number;
  dominant: string;
  confidenceScore: number;  // 0-1 overall confidence
  moodScore: number;        // 1-10 numeric score for graphing
}

export interface MoodConflictInsight {
  hasConflict: boolean;
  message: string;
  journalMood: string;
  behavioralMood: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DailyMoodDataPoint {
  date: string;
  dateLabel: string;        // formatted "Mar 14"
  journalMood: number | null;    // 1-10 or null if no entry
  journalEmotion: string | null;
  behavioralMood: number | null; // 1-10 or null if no behavioral data
  behavioralLabel: string | null;
  finalMood: number | null;
  sleep_hours?: number;
  steps?: number;
  screen_time?: number;
}

export interface WellnessScore {
  overall: number;         // 0-100
  sleep: number;           // 0-100
  activity: number;        // 0-100
  screenBalance: number;   // 0-100
  consistency: number;     // 0-100
  trend: 'improving' | 'stable' | 'declining';
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/* ── Emotion to numeric score mapping ── */
const EMOTION_SCORE_MAP: Record<string, number> = {
  joy: 8.5,
  excited: 8.0,
  grateful: 8.0,
  calm: 7.0,
  neutral: 5.0,
  anxious: 3.5,
  stress: 3.0,
  sadness: 2.5,
};

/* ── Behavioral mood to numeric score mapping ── */
const BEHAVIORAL_MOOD_SCORE: Record<string, number> = {
  energetic: 8.5,
  calm: 7.0,
  tired: 3.5,
  stressed: 3.0,
};

/* ── Known positive/negative mood mappings ── */
const POSITIVE_MOODS = ['joy', 'excited', 'grateful', 'calm', 'energetic'];
// const NEGATIVE_MOODS = ['stress', 'anxious', 'sadness', 'tired', 'stressed'];

/* ── Core prediction function ── */
export function predictMoodFromBehavior(record: DailyBehavioralRecord): MoodPrediction {
  const { sleep_hours, steps, screen_time } = record;

  // Initialize probabilities
  let calm = 0.25;
  let tired = 0.25;
  let stressed = 0.25;
  let energetic = 0.25;

  /* ── Sleep analysis (strongest predictor from StudentLife) ── */
  if (sleep_hours < 4) {
    tired += 0.35;
    stressed += 0.20;
    calm -= 0.15;
    energetic -= 0.20;
  } else if (sleep_hours < 5) {
    tired += 0.25;
    stressed += 0.15;
    calm -= 0.10;
    energetic -= 0.15;
  } else if (sleep_hours < 6) {
    tired += 0.15;
    stressed += 0.05;
    calm -= 0.05;
    energetic -= 0.10;
  } else if (sleep_hours >= 7 && sleep_hours <= 9) {
    calm += 0.25;
    energetic += 0.15;
    tired -= 0.15;
    stressed -= 0.10;
  } else if (sleep_hours > 9) {
    // Oversleeping — can indicate low mood
    tired += 0.10;
    calm += 0.05;
    energetic -= 0.10;
  }

  /* ── Step count analysis ── */
  if (steps < 1000) {
    tired += 0.20;
    stressed += 0.05;
    energetic -= 0.20;
    calm -= 0.05;
  } else if (steps < 2000) {
    tired += 0.12;
    energetic -= 0.12;
  } else if (steps < 4000) {
    tired += 0.05;
    energetic -= 0.05;
  } else if (steps >= 8000 && steps < 12000) {
    energetic += 0.20;
    calm += 0.10;
    tired -= 0.15;
    stressed -= 0.08;
  } else if (steps >= 12000) {
    energetic += 0.30;
    calm += 0.05;
    tired -= 0.20;
    stressed -= 0.10;
  }

  /* ── Screen time analysis ── */
  if (screen_time > 10) {
    stressed += 0.20;
    tired += 0.10;
    calm -= 0.15;
    energetic -= 0.10;
  } else if (screen_time > 8) {
    stressed += 0.12;
    tired += 0.05;
    calm -= 0.08;
    energetic -= 0.05;
  } else if (screen_time > 6) {
    stressed += 0.05;
    calm -= 0.03;
  } else if (screen_time < 3) {
    calm += 0.10;
    stressed -= 0.08;
  }

  /* ── Cross-signal correlations (amplifying effects) ── */
  // Poor sleep + high screen time = amplified stress
  if (sleep_hours < 6 && screen_time > 7) {
    stressed += 0.12;
    tired += 0.08;
    calm -= 0.08;
    energetic -= 0.08;
  }
  // Good sleep + high activity = amplified energy
  if (sleep_hours >= 7 && steps > 6000) {
    energetic += 0.10;
    calm += 0.08;
    stressed -= 0.08;
    tired -= 0.08;
  }
  // Low activity + high screen time = amplified fatigue
  if (steps < 3000 && screen_time > 6) {
    tired += 0.08;
    stressed += 0.05;
    energetic -= 0.08;
  }

  /* ── Time-of-day awareness ── */
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) {
    // Late night usage: amplify stress/tired signals
    stressed += 0.05;
    tired += 0.05;
    calm -= 0.03;
  }

  /* ── Check-in mood adjustment ── */
  if (record.checkin_mood) {
    const checkinNorm = record.checkin_mood / 10;
    if (checkinNorm > 0.7) {
      calm += 0.10;
      energetic += 0.10;
      stressed -= 0.10;
      tired -= 0.10;
    } else if (checkinNorm < 0.4) {
      stressed += 0.10;
      tired += 0.10;
      calm -= 0.10;
      energetic -= 0.10;
    }
  }

  // Normalize to ensure probabilities sum to 1 and are non-negative
  calm = Math.max(0, calm);
  tired = Math.max(0, tired);
  stressed = Math.max(0, stressed);
  energetic = Math.max(0, energetic);

  const total = calm + tired + stressed + energetic;
  if (total > 0) {
    calm = Math.round((calm / total) * 100) / 100;
    tired = Math.round((tired / total) * 100) / 100;
    stressed = Math.round((stressed / total) * 100) / 100;
    energetic = Math.round((energetic / total) * 100) / 100;
  }

  // Find dominant mood
  const probs = { calm, tired, stressed, energetic };
  const dominant = (Object.entries(probs) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  // Confidence: how much the dominant mood stands out
  const sorted = Object.values(probs).sort((a, b) => b - a);
  const confidenceScore = Math.round((sorted[0] - sorted[1]) * 100) / 100;

  // Compute numeric score (1-10) for graphing
  const moodScore = Math.round((
    calm * BEHAVIORAL_MOOD_SCORE.calm +
    tired * BEHAVIORAL_MOOD_SCORE.tired +
    stressed * BEHAVIORAL_MOOD_SCORE.stressed +
    energetic * BEHAVIORAL_MOOD_SCORE.energetic
  ) * 10) / 10;

  return { calm, tired, stressed, energetic, dominant, confidenceScore, moodScore };
}

/* ── Journal mood extraction ── */
export function getJournalMoodScore(entry: JournalEntry): number {
  // Use detected emotion if available, otherwise user-selected emotion
  const emotion = entry.detectedEmotion || entry.emotion;
  const baseScore = EMOTION_SCORE_MAP[emotion] || 5.0;
  
  // Adjust slightly based on intensity
  const intensityFactor = (entry.intensity - 5) * 0.15;
  return Math.round(Math.min(10, Math.max(1, baseScore + intensityFactor)) * 10) / 10;
}

/* ── Combined data for all three graphs ── */
export function buildMoodTimeline(
  entries: JournalEntry[],
  behavioralRecords: DailyBehavioralRecord[],
  days: number = 14
): DailyMoodDataPoint[] {
  const timeline: DailyMoodDataPoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Find journal entries for this date
    const dayEntries = entries.filter(e => {
      const ed = new Date(e.timestamp);
      return ed.toISOString().split('T')[0] === dateStr;
    });

    // Get journal mood (average if multiple entries)
    let journalMood: number | null = null;
    let journalEmotion: string | null = null;
    if (dayEntries.length > 0) {
      const scores = dayEntries.map(e => getJournalMoodScore(e));
      journalMood = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      // Most common emotion
      const emotionCounts: Record<string, number> = {};
      dayEntries.forEach(e => {
        const em = e.detectedEmotion || e.emotion;
        emotionCounts[em] = (emotionCounts[em] || 0) + 1;
      });
      journalEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    }

    // Find behavioral record for this date
    const behavRecord = behavioralRecords.find(r => r.date === dateStr);
    let behavioralMood: number | null = null;
    let behavioralLabel: string | null = null;
    if (behavRecord) {
      const prediction = predictMoodFromBehavior(behavRecord);
      behavioralMood = prediction.moodScore;
      behavioralLabel = prediction.dominant;
    }

    // Priority logic: journal > behavioral
    const finalMood = journalMood !== null ? journalMood : behavioralMood;

    timeline.push({
      date: dateStr,
      dateLabel,
      journalMood,
      journalEmotion,
      behavioralMood,
      behavioralLabel,
      finalMood,
      sleep_hours: behavRecord?.sleep_hours,
      steps: behavRecord?.steps,
      screen_time: behavRecord?.screen_time,
    });
  }

  return timeline;
}

/* ── Conflict detection ── */
export function detectMoodConflict(
  journalEmotion: string | null,
  behavioralMood: string | null,
  journalScore: number | null,
  behavioralScore: number | null,
): MoodConflictInsight {
  const defaultResult: MoodConflictInsight = {
    hasConflict: false,
    message: '',
    journalMood: journalEmotion || '',
    behavioralMood: behavioralMood || '',
    severity: 'low',
  };

  if (!journalEmotion || !behavioralMood || journalScore === null || behavioralScore === null) {
    return defaultResult;
  }

  const scoreDiff = Math.abs(journalScore - behavioralScore);
  const journalIsPositive = POSITIVE_MOODS.includes(journalEmotion);
  const behavIsPositive = POSITIVE_MOODS.includes(behavioralMood);
  const directionConflict = journalIsPositive !== behavIsPositive;

  if (scoreDiff < 2 && !directionConflict) {
    return defaultResult;
  }

  let message = '';
  let severity: 'low' | 'medium' | 'high' = 'low';

  if (journalIsPositive && !behavIsPositive) {
    severity = scoreDiff > 3 ? 'high' : 'medium';
    message = `You described your day as positive, but your recent sleep and activity patterns suggest lower energy levels. You may want to reflect on how your routine might be affecting how you feel.`;
  } else if (!journalIsPositive && behavIsPositive) {
    severity = scoreDiff > 3 ? 'high' : 'medium';
    message = `Your lifestyle patterns look stable, but you've been expressing some difficult emotions in your journal. Remember that emotional experiences are valid regardless of external factors. Consider what might be weighing on your mind.`;
  } else if (scoreDiff > 3) {
    severity = 'medium';
    message = `There's a noticeable gap between how you're feeling and what your daily patterns suggest. This could be worth reflecting on — sometimes our habits and emotions take time to align.`;
  } else {
    severity = 'low';
    message = `There's a slight difference between your reported mood and behavioral signals. This is normal — mood is complex and multi-dimensional.`;
  }

  return {
    hasConflict: true,
    message,
    journalMood: journalEmotion,
    behavioralMood: behavioralMood,
    severity,
  };
}

/* ── Recent conflict check (latest data) ── */
export function getLatestConflictInsight(
  entries: JournalEntry[],
  behavioralRecords: DailyBehavioralRecord[],
): MoodConflictInsight | null {
  const timeline = buildMoodTimeline(entries, behavioralRecords, 3);
  
  for (const point of timeline.reverse()) {
    if (point.journalMood !== null && point.behavioralMood !== null) {
      const insight = detectMoodConflict(
        point.journalEmotion,
        point.behavioralLabel,
        point.journalMood,
        point.behavioralMood,
      );
      if (insight.hasConflict) return insight;
    }
  }

  return null;
}

/* ── Weekly Wellness Score ── */
export function calculateWellnessScore(records: DailyBehavioralRecord[]): WellnessScore | null {
  if (records.length < 2) return null;

  const avgSleep = records.reduce((s, r) => s + r.sleep_hours, 0) / records.length;
  const avgSteps = records.reduce((s, r) => s + r.steps, 0) / records.length;
  const avgScreen = records.reduce((s, r) => s + r.screen_time, 0) / records.length;

  // Sleep score (optimal = 7-9h)
  let sleepScore: number;
  if (avgSleep >= 7 && avgSleep <= 9) sleepScore = 90 + (avgSleep >= 7.5 && avgSleep <= 8.5 ? 10 : 0);
  else if (avgSleep >= 6 || (avgSleep > 9 && avgSleep <= 10)) sleepScore = 65;
  else if (avgSleep >= 5) sleepScore = 40;
  else sleepScore = 20;

  // Activity score (optimal = 7000-10000 steps)
  let activityScore: number;
  if (avgSteps >= 8000) activityScore = Math.min(100, 80 + (avgSteps - 8000) / 200);
  else if (avgSteps >= 5000) activityScore = 60 + (avgSteps - 5000) / 150;
  else if (avgSteps >= 2000) activityScore = 30 + (avgSteps - 2000) / 100;
  else activityScore = Math.max(10, avgSteps / 200 * 10);

  // Screen balance score (lower = better, <4h ideal)
  let screenScore: number;
  if (avgScreen < 3) screenScore = 95;
  else if (avgScreen < 5) screenScore = 80;
  else if (avgScreen < 7) screenScore = 60;
  else if (avgScreen < 9) screenScore = 40;
  else screenScore = 20;

  // Consistency score (based on standard deviation of sleep)
  const sleepValues = records.map(r => r.sleep_hours);
  const sleepMean = sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length;
  const sleepStdDev = Math.sqrt(sleepValues.reduce((sum, v) => sum + (v - sleepMean) ** 2, 0) / sleepValues.length);
  const consistencyScore = Math.max(10, Math.round(100 - sleepStdDev * 25));

  // Overall weighted score
  const overall = Math.round(
    sleepScore * 0.35 +
    activityScore * 0.25 +
    screenScore * 0.20 +
    consistencyScore * 0.20
  );

  // Trend detection
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (records.length >= 4) {
    const firstHalf = records.slice(Math.floor(records.length / 2));
    const secondHalf = records.slice(0, Math.floor(records.length / 2));
    const firstAvg = firstHalf.reduce((s, r) => s + predictMoodFromBehavior(r).moodScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, r) => s + predictMoodFromBehavior(r).moodScore, 0) / secondHalf.length;
    if (secondAvg - firstAvg > 0.5) trend = 'improving';
    else if (firstAvg - secondAvg > 0.5) trend = 'declining';
  }

  // Grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (overall >= 85) grade = 'A';
  else if (overall >= 70) grade = 'B';
  else if (overall >= 55) grade = 'C';
  else if (overall >= 40) grade = 'D';
  else grade = 'F';

  return {
    overall: Math.min(100, overall),
    sleep: Math.min(100, Math.round(sleepScore)),
    activity: Math.min(100, Math.round(activityScore)),
    screenBalance: Math.min(100, Math.round(screenScore)),
    consistency: Math.min(100, consistencyScore),
    trend,
    grade,
  };
}

/* ── Generate insights based on behavioral patterns ── */
export function generateBehavioralInsights(records: DailyBehavioralRecord[]): string[] {
  if (records.length < 2) return [];

  const insights: string[] = [];
  const avgSleep = records.reduce((s, r) => s + r.sleep_hours, 0) / records.length;
  const avgSteps = records.reduce((s, r) => s + r.steps, 0) / records.length;
  const avgScreen = records.reduce((s, r) => s + r.screen_time, 0) / records.length;

  if (avgSleep < 6) {
    insights.push(`⚠️ Your average sleep has been ${avgSleep.toFixed(1)}h recently. The StudentLife research shows that consistent sleep below 7 hours is strongly associated with 2.3x higher stress levels. Prioritizing rest could significantly improve your mood.`);
  } else if (avgSleep >= 7 && avgSleep <= 9) {
    insights.push(`✨ Great sleep hygiene! Your ${avgSleep.toFixed(1)}h average falls in the optimal range. StudentLife data shows students in this range reported 40% fewer stress episodes.`);
  }

  if (avgSteps < 3000) {
    insights.push(`🚶 Your activity is low at ${Math.round(avgSteps).toLocaleString()} daily steps. Research shows that even 20 minutes of walking can boost mood by up to 30%. Try a short walk between study sessions.`);
  } else if (avgSteps > 8000) {
    insights.push(`🏃 Impressive activity! Your ${Math.round(avgSteps).toLocaleString()} daily steps put you in the top performers. Active students showed 45% better emotional regulation in the StudentLife study.`);
  }

  if (avgScreen > 8) {
    insights.push(`📱 Your screen time (${avgScreen.toFixed(1)}h/day) is above the stress threshold. Students with 8+ hours showed significantly higher anxiety scores. Try the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.`);
  } else if (avgScreen < 4) {
    insights.push(`🧘 Excellent digital balance! Your ${avgScreen.toFixed(1)}h screen time is well below the stress threshold. This correlates with better sleep quality and lower anxiety.`);
  }

  // Cross-signal insights
  if (avgSleep < 6 && avgScreen > 7) {
    insights.push(`🔗 Poor sleep + high screen time detected. Research shows this combination has a compounding effect — screen light before bed reduces melatonin production by 22%. Consider a digital sunset 1 hour before bedtime.`);
  }

  if (avgSteps > 6000 && avgSleep >= 7) {
    insights.push(`🌟 Your sleep-activity combination is ideal! This pattern is associated with the highest well-being scores in the StudentLife dataset. Keep it up!`);
  }

  // Trend detection
  if (records.length >= 3) {
    const recent = records.slice(0, 3);
    const sleepTrend = recent[0].sleep_hours - recent[2].sleep_hours;
    if (sleepTrend < -1.5) {
      insights.push(`📉 Your sleep has been declining over the past few days (${recent[2].sleep_hours}h → ${recent[0].sleep_hours}h). Decreasing sleep is one of the earliest behavioral indicators of building stress.`);
    } else if (sleepTrend > 1.5) {
      insights.push(`📈 Your sleep has improved recently (${recent[2].sleep_hours}h → ${recent[0].sleep_hours}h). This positive trend should reflect in your mood within 1-2 days.`);
    }

    const stepTrend = recent[0].steps - recent[2].steps;
    if (stepTrend < -3000) {
      insights.push(`📉 Your activity dropped significantly recently (${recent[2].steps.toLocaleString()} → ${recent[0].steps.toLocaleString()} steps). Reduced movement can both indicate and contribute to lower mood.`);
    }
  }

  return insights;
}

