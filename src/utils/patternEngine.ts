/**
 * Pattern Detection Engine
 * 
 * Analyzes journal entries over time to detect 7 distinct behavioral 
 * and emotional patterns (Ported from Flutter's pattern_service.dart).
 * All analysis is fully on-device.
 */

import type { JournalEntry } from './storage';
import { calculateRisk } from './spiralEngine';

export interface EmotionalPattern {
  id: string;
  name: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  confidence: number;
  dataPoints: number;
}

export function analyzePatterns(entries: JournalEntry[]): EmotionalPattern[] {
  if (entries.length < 3) return [];

  const patterns: EmotionalPattern[] = [];
  const sorted = [...entries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Take the last 14 entries or the whole array if smaller
  const recent = sorted.slice(-14);

  // 1. Weekend Recovery
  patterns.push(..._detectWeekendRecovery(recent));

  // 2. Evening Burnout
  patterns.push(..._detectEveningBurnout(recent));

  // 3. Morning Anxiety
  patterns.push(..._detectMorningAnxiety(recent));

  // 4. Intensity Spikes
  patterns.push(..._detectIntensitySpikes(recent));

  // 5. Emotional Whiplash (Rapid Swings)
  patterns.push(..._detectEmotionalWhiplash(recent));

  // 6. Academic/Performance Pressure
  patterns.push(..._detectAcademicPressure(recent));

  // 7. Emotional Numbness
  patterns.push(..._detectEmotionalNumbness(recent));

  // Sort by confidence, highest first
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

// ────────────────────────────────────────────────────────────────────────
// 1. Weekend Recovery (Higher moods on weekends)
// ────────────────────────────────────────────────────────────────────────
function _detectWeekendRecovery(entries: JournalEntry[]): EmotionalPattern[] {
  const weekendEmotions: string[] = [];
  const weekdayEmotions: string[] = [];
  let weekendCount = 0;

  for (const e of entries) {
    const d = new Date(e.timestamp);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;
    
    // Convert text emotion into internal categories based on keywords if 'Joy'/'Sadness' 
    const isPositive = ['joy', 'excited', 'grateful', 'calm', 'peaceful', 'optimistic'].includes((e.detectedEmotion || e.emotion).toLowerCase());
    
    if (isWeekend) {
      weekendCount++;
      if (isPositive) weekendEmotions.push(e.emotion);
    } else {
      if (isPositive) weekdayEmotions.push(e.emotion);
    }
  }

  if (weekendCount >= 2 && weekendEmotions.length > weekdayEmotions.length * 1.5) {
    return [{
      id: 'weekend_recovery',
      name: 'Weekend Recovery',
      description: 'Your emotional state noticeably improves on weekends. This might indicate that your weekday routine is particularly draining.',
      type: 'positive',
      confidence: Math.min(0.9, 0.5 + (weekendEmotions.length * 0.1)),
      dataPoints: weekendCount
    }];
  }
  return [];
}

// ────────────────────────────────────────────────────────────────────────
// 2. Evening Burnout (Fatigue/Stress late in day)
// ────────────────────────────────────────────────────────────────────────
function _detectEveningBurnout(entries: JournalEntry[]): EmotionalPattern[] {
  const eveningNegatives = entries.filter(e => {
    const h = new Date(e.timestamp).getHours();
    const em = (e.detectedEmotion || e.emotion).toLowerCase();
    const isNegative = ['fatigue', 'stress', 'sadness', 'anger', 'anxious', 'tired', 'burnt out'].includes(em);
    return h >= 17 && isNegative; // 5 PM to midnight
  });

  if (eveningNegatives.length >= 3) {
    return [{
      id: 'evening_burnout',
      name: 'Evening Depletion',
      description: 'You frequently report feeling fatigued or stressed late in the day. Your energy reserves might be running low before your day actually ends.',
      type: 'negative',
      confidence: Math.min(0.85, 0.5 + (eveningNegatives.length * 0.1)),
      dataPoints: eveningNegatives.length
    }];
  }
  return [];
}

// ────────────────────────────────────────────────────────────────────────
// 3. Morning Anxiety (Fear/Stress early in day)
// ────────────────────────────────────────────────────────────────────────
function _detectMorningAnxiety(entries: JournalEntry[]): EmotionalPattern[] {
  const morningAnxiety = entries.filter(e => {
    const h = new Date(e.timestamp).getHours();
    const em = (e.detectedEmotion || e.emotion).toLowerCase();
    const isFear = ['fear', 'apprehension', 'stress', 'anxious', 'worried'].includes(em);
    return h >= 5 && h <= 10 && isFear;
  });

  if (morningAnxiety.length >= 3) {
    return [{
      id: 'morning_anxiety',
      name: 'Morning Apprehension',
      description: 'You often start your day with feelings of pressure or anxiety. This anticipatory stress can drain your energy before the day even begins.',
      type: 'negative',
      confidence: Math.min(0.85, 0.5 + (morningAnxiety.length * 0.1)),
      dataPoints: morningAnxiety.length
    }];
  }
  return [];
}

// ────────────────────────────────────────────────────────────────────────
// 4. Intensity Spikes (High intensity emotional days)
// ────────────────────────────────────────────────────────────────────────
function _detectIntensitySpikes(entries: JournalEntry[]): EmotionalPattern[] {
  const highIntensity = entries.filter(e => e.intensity >= 8);
  
  if (highIntensity.length >= 4) {
    return [{
      id: 'intensity_spikes',
      name: 'High Intensity',
      description: 'Your recent emotional experiences have been very intense. You might be processing significant changes or carrying a heavy emotional load.',
      type: 'neutral',
      confidence: Math.min(0.8, 0.4 + (highIntensity.length * 0.1)),
      dataPoints: highIntensity.length
    }];
  }
  return [];
}

// ────────────────────────────────────────────────────────────────────────
// 5. Emotional Whiplash (Rapid Positive ↔ Negative Swings)
// ────────────────────────────────────────────────────────────────────────
function _detectEmotionalWhiplash(entries: JournalEntry[]): EmotionalPattern[] {
  let swings = 0;
  for (let i = 1; i < entries.length; i++) {
    const prev = (entries[i-1].detectedEmotion || entries[i-1].emotion).toLowerCase();
    const curr = (entries[i].detectedEmotion || entries[i].emotion).toLowerCase();
    
    const prevPos = ['joy', 'excited', 'grateful'].includes(prev);
    const currPos = ['joy', 'excited', 'grateful'].includes(curr);
    const prevNeg = ['sadness', 'anger', 'fear', 'fatigue'].includes(prev);
    const currNeg = ['sadness', 'anger', 'fear', 'fatigue'].includes(curr);
    
    if ((prevPos && currNeg) || (prevNeg && currPos)) {
      // Must be within 48 hours to count as a rapid swing
      const diffHrs = Math.abs(new Date(entries[i].timestamp).getTime() - new Date(entries[i-1].timestamp).getTime()) / (1000 * 60 * 60);
      if (diffHrs <= 48) swings++;
    }
  }

  if (swings >= 3) {
    return [{
      id: 'emotional_whiplash',
      name: 'Emotional Whiplash',
      description: 'Your mood has been swinging dramatically between high highs and low lows over short periods. This kind of volatility is exhausting for your nervous system.',
      type: 'negative',
      confidence: Math.min(0.9, 0.5 + (swings * 0.1)),
      dataPoints: swings
    }];
  }
  return [];
}

// ────────────────────────────────────────────────────────────────────────
// 6. Academic/Performance Pressure
// ────────────────────────────────────────────────────────────────────────
function _detectAcademicPressure(entries: JournalEntry[]): EmotionalPattern[] {
  const academicWords = [
    'exam', 'test', 'marks', 'grade', 'result', 'fail', 'study', 
    'assignment', 'deadline', 'college', 'school', 'board', 'jee', 'neet',
    'percentile', 'rank', 'cutoff'
  ];
  
  const pressureEntries = entries.filter(e => {
    const text = e.text.toLowerCase();
    const em = (e.detectedEmotion || e.emotion).toLowerCase();
    const isNegative = ['fear', 'stress', 'apprehension', 'sadness', 'fatigue'].includes(em);
    const hasWord = academicWords.some(w => text.includes(w));
    return isNegative && hasWord;
  });

  if (pressureEntries.length >= 2) {
    return [{
      id: 'academic_pressure',
      name: 'Performance Pressure',
      description: 'There is a strong connection between your academic/performance references and feelings of stress or inadequacy. You might be tying your self-worth too closely to these outcomes.',
      type: 'negative',
      confidence: Math.min(0.9, 0.6 + (pressureEntries.length * 0.1)),
      dataPoints: pressureEntries.length
    }];
  }
  return [];
}

// ────────────────────────────────────────────────────────────────────────
// 7. Emotional Numbness
// ────────────────────────────────────────────────────────────────────────
function _detectEmotionalNumbness(entries: JournalEntry[]): EmotionalPattern[] {
  const numbWords = [
    'numb', 'nothing', 'empty', 'blank', 'bored', 'don\'t care',
    'dont care', 'whatever', 'tired', 'exhausted', 'flat', 'autopilot'
  ];
  
  const numbEntries = entries.filter(e => {
    const text = e.text.toLowerCase();
    const em = (e.detectedEmotion || e.emotion).toLowerCase();
    const isFlat = ['contemplation', 'neutral', 'fatigue'].includes(em);
    const hasWord = numbWords.some(w => text.includes(w));
    return isFlat && (hasWord || e.intensity < 4);
  });

  if (numbEntries.length >= 3) {
    return [{
      id: 'emotional_numbness',
      name: 'Emotional Detachment',
      description: 'You have been recording feelings of numbness, emptiness, or moving through life on autopilot. This is often the mind\'s way of protecting itself when overwhelmed.',
      type: 'neutral',
      confidence: Math.min(0.85, 0.5 + (numbEntries.length * 0.1)),
      dataPoints: numbEntries.length
    }];
  }
  return [];
}

// ────────────────────────────────────────────────────────────────────────
// Context-Aware Journaling Prompts (Ported from Flutter)
// ────────────────────────────────────────────────────────────────────────
export function generateJournalingPrompt(entries: JournalEntry[]): string {
  const h = new Date().getHours();
  let timeContext = '';
  
  if (h >= 5 && h < 12) timeContext = 'morning';
  else if (h >= 12 && h < 17) timeContext = 'afternoon';
  else if (h >= 17 && h < 22) timeContext = 'evening';
  else timeContext = 'night';

  // 1. New user (0-1 entries)
  if (entries.length <= 1) {
    return "What's occupying your mind right now? Write without filtering — no one is grading this.";
  }

  // 2. Returning after a gap (>= 5 days)
  const sorted = [...entries].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latest = new Date(sorted[0].timestamp);
  const daysSince = Math.floor((Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince >= 5) {
    return "It's been a few days. Pick up wherever it makes sense — what's the headline of your life right now?";
  }

  // 3. Loop back to yesterday if it was intense
  if (daysSince === 1 && sorted[0].intensity >= 7) {
    const prevEmotion = sorted[0].detectedEmotion || sorted[0].emotion;
    if (['Anger', 'Apprehension', 'Sadness', 'stress', 'fear'].includes(prevEmotion)) {
      return `Yesterday sounded heavy. How is that sitting with you today? Did the dust settle?`;
    }
  }

  // 4. Time-based prompts
  const randomMath = Math.random();
  if (timeContext === 'morning') {
    return randomMath > 0.5 
      ? "As the day begins, what are you carrying from yesterday?" 
      : "If today goes exactly how you need it to, what does that look like at 8 PM tonight?";
  } else if (timeContext === 'night') {
    return randomMath > 0.5
      ? "Before you sleep, what's one thought playing on a loop that you'd like to leave here?"
      : "What did today demand of you, and what did it give back?";
  }

  // 5. Generic fallback
  const fallbacks = [
    "What's the quietest thought you've had today?",
    "If your current mood was weather, what would the forecast look like?",
    "What feels heavy right now? What feels light?",
    "Is there a conversation you're having in your head that you should write down instead?",
    "What's something you did today that nobody noticed?",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/* ── UI Adapter Functions for React Dashboard & Insights ── */

export function detectSpirals(entries: JournalEntry[]): any[] {
  const risk = calculateRisk(entries);
  const spirals = [];
  
  if (risk.shouldAlert) {
     spirals.push({
        name: 'Burnout Risk',
        severity: risk.score > 70 ? 'high' : 'medium',
        occurrences: risk.consecutiveNegativeDays,
        emotions: ['fatigue', 'stress', 'apprehension'],
        description: risk.gentleMessage
     });
  }
  
  const patterns = analyzePatterns(entries);
  for (const p of patterns) {
     if (p.type === 'negative') {
        spirals.push({
           name: p.name,
           severity: p.confidence > 0.8 ? 'high' : 'medium',
           occurrences: p.dataPoints,
           emotions: ['stress', 'fatigue'], 
           description: p.description
        });
     }
  }
  return spirals;
}

export function getDayPatterns(entries: JournalEntry[]): any[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const res = days.map(d => ({ day: d, avgMood: 0, dominantEmotion: 'neutral', entryCount: 0, moodSum: 0, emotions: {} as Record<string, number> }));
  
  for (const e of entries) {
    const d = new Date(e.timestamp).getDay();
    res[d].entryCount++;
    res[d].moodSum += e.intensity;
    const em = e.detectedEmotion || e.emotion || 'neutral';
    res[d].emotions[em] = (res[d].emotions[em] || 0) + 1;
  }
  
  return res.map(r => {
    let dominantEmotion = 'neutral';
    let maxEm = 0;
    for (const [em, count] of Object.entries(r.emotions)) {
       if (count > maxEm) { maxEm = count; dominantEmotion = em; }
    }
    return {
       day: r.day,
       avgMood: r.entryCount > 0 ? Number((r.moodSum / r.entryCount).toFixed(1)) : 0,
       dominantEmotion,
       entryCount: r.entryCount
    };
  });
}

export function generateWeeklySummary(entries: JournalEntry[]): any {
  const recent = entries.slice(-7);
  let emoji = '😐', common = 'neutral', avgMood = 7.5, trend = 'stable', count = recent.length;
  let happy = '', stress = '';
  const emCounts: Record<string, number> = {};
  let totalIntensity = 0;
  
  for (const e of recent) {
     const em = (e.detectedEmotion || e.emotion || 'neutral').toLowerCase();
     emCounts[em] = (emCounts[em] || 0) + 1;
     totalIntensity += e.intensity;
     if (['joy', 'excited', 'grateful', 'calm'].includes(em) && !happy) happy = e.text.slice(0, 50) + '...';
     if (['stress', 'anger', 'fear', 'fatigue', 'apprehension'].includes(em) && !stress) stress = e.text.slice(0, 50) + '...';
  }
  
  if (count > 0) {
      common = Object.keys(emCounts).sort((a,b) => emCounts[b] - emCounts[a])[0];
      const emojis: Record<string, string> = { joy: '🌟', sadness: '🌧️', anger: '😡', fear: '😟', stress: '😰', apprehension: '😟', calm: '😌', neutral: '😐' };
      emoji = emojis[common.toLowerCase()] || '😐';
      avgMood = Number((totalIntensity / count).toFixed(1));
  }
  
  return {
     mostCommonEmoji: emoji, mostCommonEmotion: common, avgMood, moodTrend: trend,
     entryCount: count, happiestMoment: happy, stressTrigger: stress, topTags: ['Emotional Check-in', 'Reflection']
  };
}

export function detectCorrelations(entries: JournalEntry[]): any[] {
  const correlations: any[] = [];
  if (entries.length < 5) return correlations;

  const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Late-night journaling vs next-day mood
  let lateNightCount = 0, lateNightNextMood = 0, lateNightNext = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const h = new Date(sorted[i].timestamp).getHours();
    if (h >= 1 && h <= 4) {
      lateNightCount++;
      lateNightNextMood += sorted[i + 1].intensity || 5;
      lateNightNext++;
    }
  }
  if (lateNightCount >= 2) {
    const avgNextMood = lateNightNext > 0 ? lateNightNextMood / lateNightNext : 5;
    correlations.push({
      direction: avgNextMood < 5 ? 'negative' : 'neutral',
      factor: 'Late Night Journaling',
      impact: 'Lower next-day mood',
      strength: Math.min(0.9, 0.4 + lateNightCount * 0.1),
      description: `Journaling after midnight (${lateNightCount} times) correlates with lower mood the following day. Average next-day mood: ${avgNextMood.toFixed(1)}/10.`
    });
  }

  // Weekend vs weekday mood
  const weekendMoods = sorted.filter(e => { const d = new Date(e.timestamp).getDay(); return d === 0 || d === 6; }).map(e => e.intensity || 5);
  const weekdayMoods = sorted.filter(e => { const d = new Date(e.timestamp).getDay(); return d > 0 && d < 6; }).map(e => e.intensity || 5);
  if (weekendMoods.length >= 2 && weekdayMoods.length >= 3) {
    const wkAvg = weekendMoods.reduce((a, b) => a + b, 0) / weekendMoods.length;
    const wdAvg = weekdayMoods.reduce((a, b) => a + b, 0) / weekdayMoods.length;
    if (wkAvg > wdAvg + 0.5) {
      correlations.push({
        direction: 'positive',
        factor: 'Weekend Recovery',
        impact: 'Higher mood',
        strength: Math.min(0.9, 0.4 + (wkAvg - wdAvg) * 0.15),
        description: `Weekends average ${wkAvg.toFixed(1)}/10 vs weekdays ${wdAvg.toFixed(1)}/10. Rest and reduced obligations seem to lift your mood significantly.`
      });
    }
  }

  // Academic words vs negative emotion
  const academicWords = ['exam', 'test', 'marks', 'grade', 'result', 'fail', 'jee', 'neet', 'board', 'assignment', 'deadline', 'rank', 'cutoff'];
  const academicNeg = sorted.filter(e => {
    const text = (e.text || '').toLowerCase();
    const em = (e.detectedEmotion || e.emotion || '').toLowerCase();
    const neg = ['fear', 'stress', 'apprehension', 'sadness', 'fatigue'].includes(em);
    return neg && academicWords.some(w => text.includes(w));
  });
  if (academicNeg.length >= 2) {
    correlations.push({
      direction: 'negative',
      factor: 'Academic / Performance Topics',
      impact: 'Elevated stress and fear',
      strength: Math.min(0.9, 0.5 + academicNeg.length * 0.1),
      description: `${academicNeg.length} entries link academic or performance topics with stress or fear. You may be tying self-worth closely to outcomes.`
    });
  }

  // High-intensity entries and their emotion
  const highIntense = sorted.filter(e => (e.intensity || 0) >= 8);
  if (highIntense.length >= 3) {
    const negHigh = highIntense.filter(e => ['sadness','anger','fear','fatigue','apprehension'].includes((e.detectedEmotion || e.emotion || '').toLowerCase()));
    if (negHigh.length > highIntense.length * 0.6) {
      correlations.push({
        direction: 'negative',
        factor: 'High Emotional Intensity Days',
        impact: 'Negative emotion dominates',
        strength: Math.min(0.85, 0.5 + negHigh.length * 0.08),
        description: `${negHigh.length} of your ${highIntense.length} most intense journal entries were negative. High-intensity days tend to skew towards difficult emotions.`
      });
    }
  }

  return correlations;
}

export function generateEmotionalMirror(entries: JournalEntry[]): any {
  if (entries.length === 0) {
    return {
      themes: ['Getting Started'],
      pattern: 'Begin journaling to discover your emotional patterns.',
      suggestion: 'Even a few words each day helps you understand your inner world.'
    };
  }

  const recent = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 14);

  // Detect real themes from entry content
  const themeMap: Record<string, string[]> = {
    'Academic Pressure': ['exam', 'test', 'grade', 'marks', 'study', 'result', 'jee', 'neet', 'board'],
    'Work & Productivity': ['work', 'deadline', 'project', 'meeting', 'boss', 'task', 'office'],
    'Relationships': ['friend', 'family', 'partner', 'mom', 'dad', 'person', 'people', 'love'],
    'Self-Doubt': ['fail', 'not enough', 'worthless', 'hopeless', 'can\'t', 'useless'],
    'Sleep & Rest': ['sleep', 'tired', 'exhaust', 'rest', 'nap', 'awake', 'insomnia'],
    'Inner Growth': ['learn', 'grow', 'improve', 'better', 'reflect', 'try', 'goal'],
  };

  const detectedThemes: string[] = [];
  for (const [theme, keywords] of Object.entries(themeMap)) {
    const count = recent.filter(e => {
      const text = (e.text || '').toLowerCase();
      return keywords.some(k => text.includes(k));
    }).length;
    if (count >= 2) detectedThemes.push(theme);
  }

  const themes = detectedThemes.length > 0 ? detectedThemes.slice(0, 3) : ['Daily Life', 'Emotional Processing', 'Inner Work'];

  // Pattern string based on dominant emotion
  const emCounts: Record<string, number> = {};
  for (const e of recent) {
    const em = (e.detectedEmotion || e.emotion || 'neutral').toLowerCase();
    emCounts[em] = (emCounts[em] || 0) + 1;
  }
  const dominant = Object.keys(emCounts).sort((a, b) => emCounts[b] - emCounts[a])[0] || 'neutral';

  const patternMap: Record<string, string> = {
    joy: 'Your recent entries carry a thread of genuine positivity. You\'ve been noticing and naming what feels good — that\'s a meaningful practice.',
    sadness: 'Your recent reflections show you\'ve been processing some weight. The act of putting emotion into words is one of the most powerful things you can do.',
    fear: 'Your entries reveal a mind working hard to manage uncertainty. Acknowledging anxiety is the first step to reducing its grip.',
    anger: 'Your entries show real conviction. The frustration you\'ve been expressing often points to values and limits that matter deeply to you.',
    fatigue: 'Your reflections suggest you\'ve been running on a lot. What you name as tiredness often has emotional layers worth exploring.',
    contemplation: 'Your entries show an active inner dialogue — processing, questioning, making sense of things. This is inner work in real-time.',
  };

  const pattern = patternMap[dominant] || 'Your current reflections show an active effort to untangle difficult feelings.';

  const suggestions = [
    'Acknowledge your capacity. Simply putting these feelings into words takes resilience.',
    'Try focusing your next entry on what you need, not just what\'s happening.',
    'Notice which moments bring even a small sense of relief — these are your anchors.',
    'The patterns you\'re noticing are not permanent — they\'re data points, not destiny.',
  ];
  const suggestion = suggestions[Math.floor(recent.length % suggestions.length)];

  return { themes, pattern, suggestion };
}

// ── Sustained Emotion Detection (from Flutter PatternAnalyzerService) ──
export function hasSustainedEmotion(
  entries: JournalEntry[],
  emotion: string,
  daysCount = 7,
  threshold = 4
): boolean {
  const cutoff = Date.now() - daysCount * 24 * 60 * 60 * 1000;
  const recent = entries.filter(e => new Date(e.timestamp).getTime() > cutoff);
  const days = new Set<string>();
  for (const entry of recent) {
    const em = (entry.detectedEmotion || entry.emotion || '').toLowerCase();
    const intensity = entry.intensity || 0;
    if (em === emotion.toLowerCase() && intensity > 5) {
      const d = new Date(entry.timestamp);
      days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  }
  return days.size >= threshold;
}

// ── Behavioral Nudges (from Flutter PatternAnalyzerService) ──
export function generateBehavioralNudges(entries: JournalEntry[], sleepHours = 7): string[] {
  const nudges: string[] = [];
  const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (sorted.length > 0) {
    const daysSince = Math.floor((Date.now() - new Date(sorted[0].timestamp).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 3) {
      nudges.push("It's been a few days since your last reflection. Checking in with your thoughts might help you stay aware of how you're feeling.");
    }
  }

  const hasStress = hasSustainedEmotion(entries, 'fear') ||
    hasSustainedEmotion(entries, 'apprehension') ||
    hasSustainedEmotion(entries, 'fatigue');

  if (sleepHours < 6 && hasStress) {
    nudges.push("Your recent entries suggest stress during short sleep cycles. Prioritizing rest might help clear your mind.");
  }

  if (hasSustainedEmotion(entries, 'sadness', 7, 3)) {
    nudges.push("You've had several days of heaviness recently. Even a brief walk or a conversation with someone you trust can shift things.");
  }

  return nudges;
}
