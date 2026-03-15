/**
 * journalPipeline.ts — Full AI Pipeline Orchestrator
 *
 * Implements the exact MannMitra pipeline end-to-end:
 *
 *   User Journal Entry
 *        ↓
 *   Tokenizer  (WordPiece, via bertEngine.ts)
 *        ↓
 *   BERT Emotion Model  (TFLite EN/HI models)
 *        ↓
 *   Context Personalization  (occupation, stressors)
 *        ↓
 *   Feedback Adjustment  (word overrides)
 *        ↓
 *   Pattern Analyzer  (7 behavioral patterns + sustained emotion)
 *        ↓
 *   Reflection Generator  (companion response)
 *        ↓
 *   Insights / Nudges  (behavioral nudges + spiral risk)
 *        ↓
 *   Encrypted Local Storage  (AES-256 backup)
 */

import { detectEmotion, getEmotionEmoji, type EmotionResult, type HealthContext } from './emotionEngine';
import { generateCompanionResponse, type CompanionResponse } from './companionEngine';
import { analyzePatterns, generateBehavioralNudges, type EmotionalPattern } from './patternEngine';
import { calculateRisk, type SpiralRiskResult } from './spiralEngine';
import { encryptText, decryptText } from './encryption';
import { storage, type JournalEntry } from './storage';

// ── Pipeline Input ──────────────────────────────────────────────────────────
export interface PipelineInput {
  text: string;
  userId: string | undefined;
  /** User's display name for personalised companion messages */
  userName?: string;
  /** User-selected mood hint (e.g. from emotion chips or dashboard) */
  moodHint?: string;
  /** Sleep hours from health tracking (feeds health context phase) */
  sleepHours?: number;
  /** User profile — occupation + daily stressors for context personalization */
  occupation?: string;
  dailyStressors?: string[];
  /** Word overrides from previous feedback (adaptive learning) */
  wordOverrides?: Record<string, Record<string, number>>;
  /** Tags the user selected */
  tags?: string[];
  /** Mood slider value 0–100 — used for heatmap display ONLY, not for overriding AI intensity */
  moodSliderValue?: number;
  /** All previous entries — used for pattern analysis + spiral risk */
  allEntries?: JournalEntry[];
}

// ── Pipeline Output ─────────────────────────────────────────────────────────
export interface PipelineResult {
  /** STEP 1-4: BERT + NLP combined emotion result */
  emotionResult: EmotionResult;
  /** STEP 5: Pattern analysis on all previous entries */
  patterns: EmotionalPattern[];
  /** STEP 6: Companion reflection response */
  companionResponse: CompanionResponse;
  /** STEP 7: Behavioral nudges */
  nudges: string[];
  /** STEP 7b: Spiral risk (9-signal) */
  spiralRisk: SpiralRiskResult;
  /** STEP 8: Saved journal entry (saved to Supabase) */
  savedEntry: JournalEntry;
  /** Whether we saved an encrypted local backup */
  encryptedBackupSaved: boolean;
}

const ENCRYPTION_KEY = 'mannmitra-aes-key-v1';
const LOCAL_BACKUP_KEY = 'mm_journal_backup';

// ── Main Pipeline ────────────────────────────────────────────────────────────
export async function runJournalPipeline(input: PipelineInput): Promise<PipelineResult> {

  // ── STEPS 1-4: Tokenizer → BERT → Context Personalization → Feedback ──────
  // detectEmotion() internally calls bertEngine.analyzePipeline() which runs:
  //   1. WordPiece tokenization
  //   2. TFLite BERT inference (EN or HI model)
  //   3. Context personalization
  //   4. Feedback adjustment
  // Then adds 3 more NLP phases: negation, conjunctions, health context
  const healthCtx: HealthContext = {
    sleep_duration_hours: input.sleepHours,
  };

  // Pass occupation/stressors via wordOverrides metadata slots
  const overridesWithProfile: Record<string, Record<string, number>> = {
    ...(input.wordOverrides || {}),
    ...(input.occupation ? { _occupation: { [input.occupation]: 1 } } : {}),
    ...(input.dailyStressors?.length ? { _stressors: Object.fromEntries(input.dailyStressors.map(s => [s, 1])) } : {}),
  };

  const emotionResult = await detectEmotion(
    input.text,
    input.moodHint,
    healthCtx,
    overridesWithProfile,
  );

  const detectedEmotion = emotionResult.primaryEmotion;
  const confidence = emotionResult.confidence;
  const intensity = emotionResult.intensityScore;

  // ── STEP 5: Pattern Analyzer ────────────────────────────────────────────────
  const previousEntries = input.allEntries || [];
  const patterns = analyzePatterns(previousEntries);

  // ── STEP 6: Reflection Generator ────────────────────────────────────────────
  const companionResponse = await generateCompanionResponse(
    input.text,
    input.userName || 'there',
    healthCtx,
  );

  // ── STEP 7: Insights + Behavioral Nudges ────────────────────────────────────
  const nudges = generateBehavioralNudges(previousEntries, input.sleepHours ?? 7);

  // ── STEP 7b: Spiral Risk (9-signal) ─────────────────────────────────────────
  const spiralRisk = calculateRisk(previousEntries, {
    sleep_hours: input.sleepHours,
  });

  // ── STEP 8: Encrypted Local Storage ─────────────────────────────────────────
  let encryptedBackupSaved = false;
  try {
    const encryptedText = await encryptText(input.text, ENCRYPTION_KEY);
    const existingBackup = JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || '[]');
    existingBackup.push({
      ts: new Date().toISOString(),
      emotion: detectedEmotion,
      encryptedText,
    });
    // Keep last 50 entries in local backup
    const trimmed = existingBackup.slice(-50);
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(trimmed));
    encryptedBackupSaved = true;
  } catch (err) {
    console.warn('Encrypted local backup failed (non-critical):', err);
  }

  // ── STEP 8b: Save to Supabase ────────────────────────────────────────────────
  const savedEntry = await storage.saveEntry(input.userId, {
    emotion: detectedEmotion,
    emoji: getEmotionEmoji(detectedEmotion),
    // Use AI-detected intensity as primary; slider value (0-100 → 0-10) used only
    // when there is no AI result (shouldn’t happen normally).
    intensity: intensity ?? (input.moodSliderValue !== undefined ? Math.round(input.moodSliderValue / 10) : 5),
    text: input.text,
    tags: input.tags || [],
    wordCount: input.text.trim().split(/\s+/).filter(Boolean).length,
    detectedEmotion,
    confidence,
    sleepHours: input.sleepHours,
  } as any);

  return {
    emotionResult,
    patterns,
    companionResponse,
    nudges,
    spiralRisk,
    savedEntry,
    encryptedBackupSaved,
  };
}

// ── Read encrypted local backup ───────────────────────────────────────────────
export async function readEncryptedBackup(): Promise<Array<{ ts: string; emotion: string; text: string }>> {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || '[]');
    const results = [];
    for (const item of raw) {
      try {
        const text = await decryptText(item.encryptedText, ENCRYPTION_KEY);
        results.push({ ts: item.ts, emotion: item.emotion, text });
      } catch {
        results.push({ ts: item.ts, emotion: item.emotion, text: '[decryption failed]' });
      }
    }
    return results;
  } catch {
    return [];
  }
}
