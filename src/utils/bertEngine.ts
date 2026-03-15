/**
 * bertEngine.ts — Exact Flutter AI Pipeline (TFLite BERT)
 *
 * Loads emotion_model_en.tflite / emotion_model_hi.tflite from /public/models/
 * using the TensorFlow.js TFLite runtime loaded from CDN at runtime (not bundled
 * via npm, because @tensorflow/tfjs-tflite is CJS-only and incompatible with Vite).
 *
 * Pipeline (exact match to Flutter's ai_engine_service.dart):
 *   STEP 1 — WordPiece tokenization (vocab_en.txt / vocab_hi.txt)
 *   STEP 2 — TFLite BERT inference (emotion_model_en/hi.tflite)
 *   STEP 3 — Context Personalization (occupation, daily stressors)
 *   STEP 4 — User Feedback Adjustment (word overrides)
 *
 * Output classes (Flutter's 6 custom labels, index 0-5):
 *   0=joy  1=sadness  2=anger  3=fear  4=fatigue  5=contemplation
 *
 * Graceful fallback: if TFLite fails to load (offline / first visit),
 * the function returns uniform 0.05 probabilities so the NLP lexicon
 * engine (emotionEngine.ts phases 0-3) dominates. HuggingFace DistilBERT
 * also runs as a secondary fallback inside emotionEngine.ts Phase 4.
 */

export const FLUTTER_EMOTION_CATEGORIES = [
  'joy', 'sadness', 'anger', 'fear', 'fatigue', 'contemplation'
] as const;
export type FlutterEmotion = typeof FLUTTER_EMOTION_CATEGORIES[number];

export interface BertEmotionResult {
  primaryEmotion: string;
  primaryCategory: FlutterEmotion;
  scores: Record<FlutterEmotion, number>;
  intensityScore: number;
  confidence: number;
  method: string;
}

export interface UserProfileContext {
  occupation?: string;
  dailyStressors?: string[];
}

// ── WordPiece Tokenizer ─────────────────────────────────────────────────────
class WordPieceTokenizer {
  private vocab: Map<string, number>;
  static readonly MAX_LEN = 128;
  static readonly CLS = 101;
  static readonly SEP = 102;
  static readonly UNK = 100;
  static readonly PAD = 0;

  constructor(vocabMap: Map<string, number>) { this.vocab = vocabMap; }

  tokenize(text: string): { inputIds: number[]; attentionMask: number[] } {
    const words = text.toLowerCase().trim().split(/\s+/);
    const ids: number[] = [WordPieceTokenizer.CLS];

    for (const word of words) {
      if (ids.length >= WordPieceTokenizer.MAX_LEN - 1) break;
      if (this.vocab.has(word)) {
        ids.push(this.vocab.get(word)!);
      } else {
        const subTokens = this.wordPiece(word);
        for (const tok of subTokens) {
          if (ids.length >= WordPieceTokenizer.MAX_LEN - 1) break;
          ids.push(this.vocab.get(tok) ?? WordPieceTokenizer.UNK);
        }
      }
    }
    ids.push(WordPieceTokenizer.SEP);
    while (ids.length < WordPieceTokenizer.MAX_LEN) ids.push(WordPieceTokenizer.PAD);
    return { inputIds: ids, attentionMask: ids.map(id => id === WordPieceTokenizer.PAD ? 0 : 1) };
  }

  private wordPiece(word: string): string[] {
    if (this.vocab.has(word)) return [word];
    const result: string[] = [];
    let remaining = word;
    while (remaining.length > 0) {
      let found = false;
      for (let end = remaining.length; end > 0; end--) {
        const substr = result.length === 0 ? remaining.slice(0, end) : '##' + remaining.slice(0, end);
        if (this.vocab.has(substr)) { result.push(substr); remaining = remaining.slice(end); found = true; break; }
      }
      if (!found) { result.push('[UNK]'); break; }
    }
    return result;
  }
}

// ── State ──────────────────────────────────────────────────────────────────
let tokenizerEn: WordPieceTokenizer | null = null;
let tokenizerHi: WordPieceTokenizer | null = null;
let tfliteModels: { en: any; hi: any } | null = null;
let loadPromise: Promise<void> | null = null;
let tfliteAvailable = false;

async function loadVocab(url: string): Promise<WordPieceTokenizer> {
  const text = await fetch(url).then(r => r.text());
  const map = new Map<string, number>();
  text.split('\n').forEach((line, i) => { if (line.trim()) map.set(line.trim(), i); });
  return new WordPieceTokenizer(map);
}

async function injectTFLiteScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).tflite) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/tf-tflite.min.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('TFLite CDN load failed'));
    document.head.appendChild(s);
  });
}

export async function initBertEngine(): Promise<void> {
  if (tfliteAvailable || loadPromise) return loadPromise ?? Promise.resolve();
  loadPromise = (async () => {
    try {
      // Load vocabs and TFLite CDN script in parallel
      const [tokEn, tokHi] = await Promise.all([
        loadVocab('/models/vocab_en.txt'),
        loadVocab('/models/vocab_hi.txt'),
        injectTFLiteScript(),
      ]);
      tokenizerEn = tokEn;
      tokenizerHi = tokHi;

      const tfliteLib = (window as any).tflite;
      if (!tfliteLib?.loadTFLiteModel) throw new Error('TFLite not available after script load');

      const [en, hi] = await Promise.all([
        tfliteLib.loadTFLiteModel('/models/emotion_model_en.tflite'),
        tfliteLib.loadTFLiteModel('/models/emotion_model_hi.tflite'),
      ]);
      tfliteModels = { en, hi };
      tfliteAvailable = true;
      console.log('✅ TFLite BERT engines loaded (EN + HI)');
    } catch (err) {
      console.warn('TFLite BERT unavailable — NLP+HuggingFace fallback active:', err);
      tfliteAvailable = false;
    }
  })();
  return loadPromise;
}

// ── Language Detection ──────────────────────────────────────────────────────
function isHindiOrHinglish(text: string): boolean {
  if (/[\u0900-\u097F]/.test(text)) return true;
  const words = text.toLowerCase().split(/\W+/);
  const markers = ['hai', 'kya', 'toh', 'mein', 'bhi', 'nahi', 'bahut', 'yaar', 'aur', 'gaya'];
  return words.some(w => markers.includes(w));
}

// ── Softmax ─────────────────────────────────────────────────────────────────
function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// ── STEP 1+2: Tokenize + BERT Inference ─────────────────────────────────────
function runBertInference(text: string): Record<FlutterEmotion, number> {
  const uniform = Object.fromEntries(FLUTTER_EMOTION_CATEGORIES.map(c => [c, 0.05])) as Record<FlutterEmotion, number>;
  if (!tfliteAvailable || !tfliteModels) return uniform;

  const useHindi = isHindiOrHinglish(text);
  const tokenizer = useHindi ? (tokenizerHi ?? tokenizerEn) : (tokenizerEn ?? tokenizerHi);
  const model = useHindi ? tfliteModels.hi : tfliteModels.en;
  if (!tokenizer || !model) return uniform;

  try {
    const { inputIds, attentionMask } = tokenizer.tokenize(text);
    model.setInput(0, Int32Array.from(inputIds));
    model.setInput(1, Int32Array.from(attentionMask));
    model.invoke();
    const logits = Array.from(model.getOutput(0).data as Float32Array);
    const probs = softmax(logits);
    const result = {} as Record<FlutterEmotion, number>;
    FLUTTER_EMOTION_CATEGORIES.forEach((cat, i) => { result[cat] = probs[i] ?? 0; });
    return result;
  } catch {
    return uniform;
  }
}

// ── STEP 3: Context Personalization ─────────────────────────────────────────
function applyContextPersonalization(
  scores: Record<FlutterEmotion, number>,
  text: string,
  profile: UserProfileContext
): Record<FlutterEmotion, number> {
  const adj = { ...scores };
  const lower = text.toLowerCase();

  if (profile.occupation?.toLowerCase() === 'student' &&
    ['exam', 'assignment', 'grades', 'marks', 'result', 'jee', 'neet'].some(w => lower.includes(w))) {
    adj.fear = (adj.fear || 0) + 0.15;
    adj.fatigue = (adj.fatigue || 0) + 0.10;
  }
  if (['professional', 'working'].includes(profile.occupation?.toLowerCase() || '') &&
    ['boss', 'meeting', 'deadline', 'work'].some(w => lower.includes(w))) {
    adj.anger = (adj.anger || 0) + 0.10;
    adj.fatigue = (adj.fatigue || 0) + 0.10;
  }
  for (const stressor of profile.dailyStressors || []) {
    if (lower.includes(stressor.toLowerCase())) {
      adj.anger = (adj.anger || 0) + 0.10;
      adj.sadness = (adj.sadness || 0) + 0.10;
    }
  }
  return normalizeScores(adj);
}

// ── STEP 4: Feedback Adjustment ─────────────────────────────────────────────
function applyFeedbackAdjustment(
  scores: Record<FlutterEmotion, number>,
  text: string,
  wordOverrides: Record<string, Record<string, number>>
): Record<FlutterEmotion, number> {
  const adj = { ...scores };
  const lower = text.toLowerCase();
  for (const key of Object.keys(wordOverrides)) {
    if (lower.includes(key)) {
      for (const [label, count] of Object.entries(wordOverrides[key])) {
        if (count > 2) {
          const cat = labelToCategory(label);
          if (cat) adj[cat] = (adj[cat] || 0) + count * 0.05;
        }
      }
    }
  }
  return normalizeScores(adj);
}

function normalizeScores(scores: Record<FlutterEmotion, number>): Record<FlutterEmotion, number> {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total === 0) return scores;
  const out = {} as Record<FlutterEmotion, number>;
  for (const cat of FLUTTER_EMOTION_CATEGORIES) out[cat] = (scores[cat] || 0) / total;
  return out;
}

function labelToCategory(label: string): FlutterEmotion | null {
  const map: Record<string, FlutterEmotion> = {
    Joy: 'joy', Sadness: 'sadness', Anger: 'anger',
    Apprehension: 'fear', Fatigue: 'fatigue', Contemplation: 'contemplation',
    joy: 'joy', sadness: 'sadness', anger: 'anger',
    fear: 'fear', fatigue: 'fatigue', contemplation: 'contemplation',
  };
  return map[label] || null;
}

function categoryToUI(cat: FlutterEmotion): string {
  return { joy: 'Joy', sadness: 'Sadness', anger: 'Anger', fear: 'Apprehension', fatigue: 'Fatigue', contemplation: 'Contemplation' }[cat];
}

// ── Primary Entry Point ──────────────────────────────────────────────────────
export async function analyzePipeline(
  text: string,
  profile: UserProfileContext = {},
  wordOverrides: Record<string, Record<string, number>> = {}
): Promise<BertEmotionResult> {
  // Fire init if not started (non-blocking — vocabs return immediately after first call)
  if (!loadPromise) initBertEngine();

  const base = runBertInference(text);
  const contextAdj = applyContextPersonalization(base, text, profile);
  const final = applyFeedbackAdjustment(contextAdj, text, wordOverrides);

  let primaryCat: FlutterEmotion = 'contemplation';
  let maxProb = 0;
  for (const cat of FLUTTER_EMOTION_CATEGORIES) {
    if ((final[cat] || 0) > maxProb) { maxProb = final[cat]!; primaryCat = cat; }
  }

  return {
    primaryEmotion: categoryToUI(primaryCat),
    primaryCategory: primaryCat,
    scores: final,
    intensityScore: Math.max(1, Math.min(10, Math.round(maxProb * 10))),
    confidence: maxProb,
    method: tfliteAvailable ? `tflite-bert-${isHindiOrHinglish(text) ? 'hi' : 'en'}` : 'tflite-pending',
  };
}
