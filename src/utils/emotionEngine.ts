/**
 * On-Device Emotion Detection Engine (Advanced NLP + BERT)
 * Ports the advanced Dart NLP pipeline (Hinglish/Hindi lexicons, negation, 
 * contrastive conjunctions, health context) and combines it with the existing 
 * Transformers.js BERT emotion classifier as a secondary signal.
 * All inference happens entirely in-browser.
 */

import { pipeline, type TextClassificationPipeline } from '@huggingface/transformers';

/* ── Types ── */
export interface EmotionTrigger {
  word: string;
  category: string;
  startIndex: number;
  endIndex: number;
  weight: number;
  negated: boolean;
}

export interface EmotionResult {
  emotion: string; // Used for backward compatibility, mapped to primaryEmotion
  primaryEmotion: string;
  intensityScore: number;
  confidence: number;
  method: string;
  reflectionPrompt: string;
  awarenessInsight: string;
  triggers: EmotionTrigger[];
  scores: Record<string, number>;
  vocabularyNote?: string;
  allScores: { label: string; score: number }[]; // For BERT compatibility
}

export interface HealthContext {
  sleep_duration_hours?: number;
  [key: string]: any;
}

/* ── HuggingFace BERT Pipeline (Secondary Signal) ── */
const EMOTION_MAP: Record<string, string> = {
  joy: 'Joy',
  love: 'Joy',
  surprise: 'Contemplation',
  sadness: 'Sadness',
  anger: 'Anger',
  fear: 'Apprehension',
};

const EMOTION_EMOJI: Record<string, string> = {
  Joy: '🌟',
  grateful: '🙏',
  excited: '⚡',
  Sadness: '🌧️',
  stress: '😰',
  Apprehension: '😟',
  Anger: '😡',
  Contemplation: '🤔',
  Fatigue: '🥱',
  Introspection: '🧘',
  neutral: '😐',
  calm: '😌',
};

let classifierInstance: TextClassificationPipeline | null = null;
let loadingPromise: Promise<TextClassificationPipeline | null> | null = null;
let bertFailed = false; // Once failed, skip future attempts

async function getClassifier(): Promise<TextClassificationPipeline | null> {
  if (bertFailed) return null;
  if (classifierInstance) return classifierInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = Promise.race([
    // Try loading the model
    pipeline(
      'text-classification',
      'Xenova/distilbert-base-uncased-finetuned-emotion',
      { dtype: 'q8' }
    ).then((p) => {
      classifierInstance = p as TextClassificationPipeline;
      loadingPromise = null;
      return classifierInstance;
    }),
    // 8-second timeout — fallback to NLP-only mode
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
  ]).catch((err) => {
    console.warn("BERT model unavailable, using NLP-only mode:", err?.message || err);
    bertFailed = true;
    loadingPromise = null;
    return null;
  });

  return loadingPromise;
}

export async function preloadModel(): Promise<void> {
  try { await getClassifier(); } catch { /* silently ignore */ }
}


export function getEmotionEmoji(emotion: string): string {
  // Try exact match, then lowercase, then default
  return EMOTION_EMOJI[emotion] || EMOTION_EMOJI[emotion.charAt(0).toUpperCase() + emotion.slice(1)] || EMOTION_EMOJI[emotion.toLowerCase()] || '😐';
}

/* ── Advanced NLP Lexicons (Ported from flutter llm_service.dart) ── */

const HINGLISH_PHRASES: Record<string, string[]> = {
  sadness: [
    'bahut bura laga', 'dil bhaari hai', 'rona aa raha hai',
    'bahut dukh hua', 'akela feel ho raha hun', 'kuch acha nahi lag raha',
    'sab chod dena chahta hun', 'mann nahi lag raha', 'bahut mushkil hai',
    'rona chahta hun', 'samajh nahi aata kuch', 'bahut toot gaya',
    'dil toot gaya', 'koi nahi hai mere liye', 'sab akele karna padta hai',
    'kisi ne nahi samjha', 'feel kar raha hun sad', 'miss kar raha hun',
    'bohot bura feel ho raha', 'life mein kuch nahi',
    'marks kam aaye', 'result acha nahi tha', 'fail ho gaya',
    'sab ne expect kiya tha', 'disappoint kar diya',
  ],
  anger: [
    'bahut gussa aa raha hai', 'itna gussa hai mujhe', 'bilkul sahi nahi',
    'bada bura laga yaar', 'naraaz hun', 'tang aa gaya hun',
    'bohot bura kiya unhone', 'galat hai ye bilkul', 'chilla diya',
    'kyu karte hain aisa', 'itna unfair kyun', 'mujhse bhi puchha hota',
    'meri baat suno kabhi', 'bakwaas bandh karo',
    'itna gussa kyu dilate ho', 'dimag mat khao',
  ],
  fear: [
    'dar lag raha hai', 'tension ho rahi hai', 'kal exam hai',
    'bahut pressure hai', 'pata nahi kya hoga', 'ghabra raha hun',
    'nind nahi aa rahi', 'zyada tension ho gayi', 'pareshan hun bahut',
    'result ka dar hai', 'kya hoga mera', 'sochke hi darna lagta hai',
    'anxiety ho rahi hai', 'kuch hoga toh nahi', 'sab theek hoga na',
    'jee ka result aayega', 'board mein kya hoga', 'merit mein aaunga',
    'parents ko kya bataunga', 'log kya kahenge', 'society mein face kaise karunga',
    'career kharab ho jayega', 'future nahi dikh raha',
  ],
  joy: [
    'bahut acha laga', 'khush hun yaar', 'maja aa gaya',
    'best din tha aaj', 'bahut accha hua', 'dil khush hai',
    'mast feel ho raha', 'sab theek ho gaya', 'itna acha laga',
    'khushi ho rahi hai', 'dil bhaara hua hai acche se',
    'proud feel kar raha hun', 'finally kar diya', 'ho gaya yaar',
    'selected ho gaya', 'pass kar gaya', 'rank aayi',
    'acha score aaya', 'family khush hai', 'sab ne appreciate kiya',
  ],
  fatigue: [
    'bahut thak gaya hun', 'nind aa rahi hai', 'energy nahi hai bilkul',
    'kuch karne ka mann nahi', 'so jaana chahta hun', 'bahut zyada thak gaya',
    'kaam nahi kar pa raha', 'thaka hua hun', 'bas karna hai',
    'aur nahi hoga', 'haare hain hum', 'uth nahi pa raha',
    'sab kuch ek jaisa lag raha', 'routine boring ho gayi',
    'kuch feel nahi ho raha', 'sab numbness lag raha',
  ],
};

const HINDI_DEVANAGARI_PHRASES: Record<string, string[]> = {
  sadness: [
    'बहुत बुरा लगा', 'दिल भारी है', 'रोना आ रहा है',
    'बहुत दुख हुआ', 'अकेला महसूस हो रहा हूँ',
    'कुछ अच्छा नहीं लग रहा', 'टूट गया हूँ',
    'दिल टूट गया', 'कोई नहीं है मेरे लिए',
  ],
  anger: [
    'बहुत गुस्सा आ रहा है', 'इतना गुस्सा है',
    'बिल्कुल सही नहीं', 'नाराज़ हूँ', 'तंग आ गया हूँ',
    'बहुत बुरा किया', 'गलत है यह',
  ],
  fear: [
    'डर लग रहा है', 'बहुत टेंशन है', 'घबरा रहा हूँ',
    'परेशान हूँ', 'पता नहीं क्या होगा',
    'नींद नहीं आ रही', 'भविष्य नहीं दिख रहा',
    'परिणाम का डर है', 'माता-पिता को क्या बताऊँगा',
  ],
  joy: [
    'बहुत अच्छा लगा', 'खुश हूँ', 'दिल खुश है',
    'बहुत अच्छा हुआ', 'गर्व महसूस हो रहा है',
    'आखिरकार हो गया', 'चुना गया',
  ],
  fatigue: [
    'बहुत थक गया हूँ', 'नींद आ रही है', 'ऊर्जा नहीं है',
    'कुछ करने का मन नहीं', 'बस करना है यह सब',
    'उठ नहीं पा रहा', 'सब कुछ एक जैसा लग रहा है',
  ],
};

const HINGLISH_LEXICON: Record<string, string[]> = {
  sadness: [
    'dukh', 'dukhi', 'udaas', 'udasi', 'rona', 'roye', 'ro',
    'tanha', 'akela', 'akeli', 'akelapan', 'toota', 'tooti', 'toot',
    'bikhar', 'khoye', 'khoya', 'kho', 'dard', 'takleef', 'taklif',
    'bura', 'buri', 'mushkil', 'tootna', 'dhundla',
    'disappoint', 'miss', 'yaad', 'shikayat',
    'fail', 'haar', 'haara', 'haari', 'kamzor', 'kamzori',
  ],
  anger: [
    'gussa', 'gusse', 'naraaz', 'naraz', 'chidh', 'chidha',
    'jhunjhla', 'irritate', 'khafa', 'tang', 'aakrosh',
    'galat', 'unfair', 'bura', 'chilla', 'chillana',
    'ladai', 'jhagda', 'jhagra', 'beizzat', 'insult',
    'zulm', 'anyay', 'nafrat', 'ghrina',
  ],
  fear: [
    'dar', 'darr', 'dara', 'dari', 'darna', 'ghabra', 'ghabrahat',
    'tension', 'pareshan', 'pareshaan', 'pareshani', 'chinta',
    'fikr', 'fikar', 'behla', 'pressure', 'exam', 'result',
    'anxiety', 'nervous', 'panic', 'stress',
    'uncertain', 'confused', 'doubt', 'shaq', 'ashanka',
  ],
  joy: [
    'khush', 'khushi', 'acha', 'accha', 'aachi', 'maja', 'mazaa',
    'hasna', 'hasi', 'muskura', 'muskaan', 'pyar', 'pyaar',
    'proud', 'garv', 'jeet', 'jeeta', 'jeeti', 'kamyab', 'kamyabi',
    'safal', 'safalta', 'shaandar', 'badhiya', 'zabardast',
    'mast', 'chill', 'sukh', 'sukoon', 'chain', 'anand',
    'pass', 'selected', 'topper', 'rank',
  ],
  fatigue: [
    'thak', 'thaka', 'thaki', 'thakaan', 'thakavat',
    'neend', 'nind', 'soya', 'soye', 'aalas', 'aalsi',
    'susti', 'sust', 'uthna', 'uth', 'energy',
    'boring', 'bore', 'uktana', 'numb', 'sab', 'khatam',
    'bas', 'haara', 'haar', 'kamzor', 'kamzori',
  ],
};

const HINDI_LEXICON: Record<string, string[]> = {
  sadness: [
    'दुख', 'दुखी', 'उदास', 'उदासी', 'रोना', 'रोया', 'रोई',
    'तनहा', 'अकेला', 'अकेली', 'अकेलापन', 'टूट', 'टूटा', 'टूटी',
    'बिखर', 'दर्द', 'तकलीफ', 'पीड़ा', 'कष्ट', 'शिकायत',
    'निराशा', 'निराश', 'हार', 'हारा', 'असफल', 'असफलता',
    'बुरा', 'मुश्किल', 'याद', 'ग्लानि',
  ],
  anger: [
    'गुस्सा', 'गुस्से', 'नाराज़', 'नाराज', 'चिढ़', 'खफा',
    'क्रोध', 'आक्रोश', 'गलत', 'बेइज्जत', 'अपमान',
    'ज़ुल्म', 'अन्याय', 'नफरत', 'घृणा', 'लड़ाई', 'झगड़ा',
  ],
  fear: [
    'डर', 'डरा', 'डरी', 'डरना', 'घबरा', 'घबराहट',
    'टेंशन', 'परेशान', 'परेशानी', 'चिंता', 'फिक्र',
    'दबाव', 'तनाव', 'आशंका', 'भय', 'संदेह',
    'अनिश्चित', 'अनिश्चितता',
  ],
  joy: [
    'खुश', 'खुशी', 'अच्छा', 'अच्छी', 'मजा', 'मज़ा',
    'हँसी', 'हंसना', 'मुस्कान', 'प्यार',
    'गर्व', 'जीत', 'जीता', 'कामयाब', 'कामयाबी',
    'सफल', 'सफलता', 'शानदार', 'बढ़िया', 'ज़बरदस्त',
    'सुख', 'सुकून', 'चैन', 'आनंद', 'मस्त',
  ],
  fatigue: [
    'थक', 'थका', 'थकी', 'थकान', 'थकावट',
    'नींद', 'आलस', 'आलसी', 'सुस्त', 'सुस्ती',
    'ऊर्जा', 'बोर', 'बोरियत', 'ऊब',
    'बस', 'खत्म', 'हार', 'कमज़ोर', 'कमज़ोरी',
  ],
};

const PHRASES: Record<string, string[]> = {
  joy: ['feel good', 'feeling great', 'so happy', 'really proud', 'made my day', 'best day', 'looking forward', 'went well', 'turned out great', 'feel blessed', 'feel grateful', 'beautiful day', 'so excited', 'can\'t wait', 'fell in love', 'good news', 'finally worked', 'it worked', 'nailed it', 'got through', 'feels right'],
  sadness: ['feel alone', 'no one cares', 'miss them', 'broke down', 'feel empty', 'can\'t stop crying', 'falling apart', 'losing hope', 'giving up', 'not good enough', 'feel worthless', 'let everyone down', 'i failed', 'feel guilty', 'wish i could', 'it hurts', 'heart heavy', 'deeply sad', 'feel like crying', 'feel lost', 'feel hollow', 'bad marks', 'low marks', 'poor marks', 'failed exam', 'didn\'t pass', 'didn\'t score', 'bad grade', 'poor grade', 'low score', 'not good', 'feel bad', 'messed up', 'screwed up', 'let down', 'let myself down'],
  anger: ['so angry', 'pissed off', 'lost my temper', 'makes me mad', 'can\'t stand', 'fed up', 'sick of', 'had enough', 'blew up', 'screamed at', 'yelled at', 'drives me crazy', 'so unfair', 'not fair', 'how dare', 'lost it', 'furious at', 'hate this', 'hate that'],
  fear: ['can\'t sleep', 'keep worrying', 'freaking out', 'so stressed', 'panic attack', 'heart racing', 'can\'t breathe', 'feel trapped', 'losing control', 'what if', 'can\'t stop thinking', 'so anxious', 'dreading it', 'feel overwhelmed', 'too much pressure', 'falling behind', 'not ready', 'so nervous', 'scared to', 'afraid of', 'exam stress', 'exam pressure', 'board exams', 'entrance exam', 'result anxiety',
    'jee pressure', 'neet pressure', 'board exam', 'board result',
    'competitive exam', 'rank anxiety', 'cut off marks',
    'selection pressure', 'merit list', 'placement pressure',
    'semester exam', 'internal marks', 'attendance shortage',
    'parents will be disappointed', 'family pressure', 'log kya kahenge',
    'society pressure', 'rishtedar poochenge', 'future uncertain',
    'career tension', 'kya hoga mera', 'sab fail ho jayega',
    'result ka dar', 'marks nahi aaye', 'fail ho gaya kya',
  ],
  fatigue: ['so tired', 'burnt out', 'no energy', 'can\'t focus', 'need rest', 'barely awake', 'running on empty', 'feel drained', 'feel heavy', 'nothing left', 'too exhausted', 'brain fog', 'can\'t think', 'body aches', 'slept badly', 'didn\'t sleep', 'stayed up', 'all nighter', 'feel weak',
    'just cannot anymore', 'done with everything', 'no motivation left',
    'staring at the wall', 'can\'t get up', 'lying in bed all day',
    'nothing feels worth it', 'going through the motions', 'autopilot mode',
    'emotionally exhausted', 'mentally drained', 'soul tired',
    'tired of being tired', 'rest doesn\'t help', 'sleep but still tired',
    'woke up exhausted', 'didn\'t want to get out of bed',
    'skipped everything today', 'cancelled plans again',
    'thak gaya hun sach mein', 'bas karna hai sab',
    'kuch karne ka mann hi nahi', 'uth nahi pa raha',
  ],
};

const LEXICON: Record<string, string[]> = {
  joy: ['happy', 'good', 'grateful', 'joy', 'great', 'wonderful', 'amazing', 'love', 'excit', 'glad', 'proud', 'peace', 'optimistic', 'content', 'reliev', 'blessed', 'thankful', 'win', 'success', 'awesome', 'best', 'smile', 'laugh', 'perfect', 'cheerful', 'delight', 'thrill', 'hope', 'inspir', 'tender', 'warm', 'bright', 'satisfy', 'comfort', 'calm', 'serene', 'bliss', 'ecsta', 'elat', 'uplift', 'celebrat', 'play', 'fun', 'enjoy', 'accomplish'],
  sadness: ['sad', 'lonely', 'miss', 'cry', 'hurt', 'empty', 'lost', 'alone', 'down', 'depress', 'low', 'vulnerable', 'despair', 'guilty', 'disappoint', 'fail', 'grief', 'sorrow', 'tears', 'broke', 'hopeless', 'numb', 'hollow', 'regret', 'shame', 'wound', 'abandon', 'neglect', 'reject', 'betray', 'mourn', 'ache', 'heavy', 'suffer', 'pain', 'melanchol', 'gloomy', 'helpless', 'worthless', 'defeat', 'marks', 'exam', 'score', 'grade', 'flunk', 'underperform'],
  anger: ['angry', 'frustrat', 'annoy', 'unfair', 'mad', 'hate', 'furious', 'irritat', 'resent', 'rage', 'pissed', 'fuming', 'livid', 'yell', 'argue', 'scream', 'hostile', 'bitter', 'contempt', 'disgust', 'aggress', 'violent', 'explod', 'snap', 'outrag', 'vengea', 'spite', 'grudge', 'provok', 'combativ', 'defiant', 'rebel', 'stubborn', 'toxic'],
  fear: ['stress', 'overwhelm', 'pressure', 'anxious', 'worry', 'nervous', 'tense', 'panic', 'scared', 'afraid', 'fear', 'terrified', 'dread', 'uneasy', 'trapped', 'restless', 'agitat', 'paranoi', 'phobia', 'hyperventilat', 'insecur', 'uncertain', 'doubt', 'suspicio', 'apprehens', 'vigilant', 'jitter', 'edgy', 'frantic', 'alarm', 'threat', 'danger', 'risk', 'crisis', 'deadline',
    'jee', 'neet', 'upsc', 'gate', 'cat', 'clat', 'boards', 'semester',
    'placement', 'internship', 'cutoff', 'percentile', 'rank', 'merit',
    'scholarship', 'reappear', 'backlog', 'arrear', 'supplementary',
    'viva', 'practical', 'attendance', 'detain', 'promotion',
  ],
  fatigue: ['tired', 'exhaust', 'sleep', 'drain', 'burnout', 'worn', 'weak', 'fatigue', 'energy', 'lazy', 'sluggish', 'letharg', 'drowsy', 'weary', 'deplet', 'overwork', 'grind', 'collaps', 'crash', 'zombie',
    'numb', 'hollow', 'disconnected', 'zoned', 'checked out', 'vacant',
    'mechanical', 'robotic', 'flatline', 'depleted', 'running on fumes',
    'burnt', 'fried', 'cooked', 'done', 'spent', 'wiped',
    'demotivat', 'apathi', 'disengag', 'detach', 'switch off',
  ],
};

const NEGATORS = [
  'not', 'no', 'never', "don't", 'dont', "didn't", 'didnt',
  "wasn't", 'wasnt', "isn't", 'isnt', "aren't", 'arent',
  "won't", 'wont', "can't", 'cant', "couldn't", 'couldnt',
  "shouldn't", 'shouldnt', "wouldn't", 'wouldnt', "hasn't",
  'hasnt', "haven't", 'havent', 'hardly', 'barely', 'neither',
  'nor', 'without', 'lack', 'lacking', 'absence of',
  'nope', 'nah', 'no way', 'not at all', 'not really', 'not even',
  'never ever', 'far from', 'anything but', 'instead of',
  'nahi', 'nahin', 'nai', 'mat', 'mujhe nahi', 'bilkul nahi',
  'kabhi nahi', 'na',
];

const AMPLIFIERS = [
  'very', 'extremely', 'incredibly', 'absolutely', 'deeply', 'really',
  'completely', 'totally', 'so', 'utterly', 'terribly', 'awfully',
  'genuinely', 'profoundly', 'immensely', 'seriously', 'super',
  'way too', 'way more', 'insanely', 'ridiculously', 'overwhelmingly',
  'devastatingly', 'unbearably', 'desperately',
  'bahut', 'bahot', 'bohot', 'itna', 'itni', 'kaafi', 'zyada',
  'bada', 'badi', 'ekdum', 'poori tarah', 'bilkul',
];

const DIMINISHERS = [
  'slightly', 'somewhat', 'a bit', 'a little', 'mildly', 'kinda',
  'sorta', 'kind of', 'sort of', 'not very', 'not really', 'barely',
  'a tad', 'rather', 'fairly', 'pretty much', 'more or less',
  'to some extent', 'a tad bit',
  'thoda', 'thodi', 'thoda sa', 'halka', 'halki', 'kam',
  'utna nahi', 'zyada nahi', 'kuch kuch',
];

const LEXICON_TAG_MAP: Record<string, string> = {
  joy: 'Joy', sadness: 'Sadness', fear: 'Apprehension', anger: 'Anger',
  surprise: 'Contemplation', disgust: 'Anger',
  peaceful: 'Joy', optimistic: 'Joy', proud: 'Joy', relieved: 'Joy', content: 'Joy',
  lonely: 'Sadness', vulnerable: 'Sadness', despair: 'Sadness',
  guilty: 'Sadness', disappointed: 'Sadness',
  anxious: 'Apprehension', insecure: 'Apprehension', overwhelmed: 'Apprehension',
  worried: 'Apprehension', dread: 'Apprehension',
  frustrated: 'Anger', resentful: 'Anger', annoyed: 'Anger',
  betrayed: 'Anger', irritated: 'Anger',
  confused: 'Contemplation', amazed: 'Joy', overcome: 'Contemplation', stunned: 'Contemplation',
  judgmental: 'Anger', appalled: 'Anger', revolted: 'Anger', averse: 'Anger',
  contemplation: 'Contemplation', ambivalence: 'Contemplation',
  introspection: 'Contemplation', fatigue: 'Fatigue',
};

/* ── NLP Helper Methods ── */

function insertSoftBoundaries(text: string): string {
  const hasPunctuation = /[,\.!\?\u0964]/.test(text);
  if (hasPunctuation) return text;

  return text
    .replace(/\s+but\s+/gi, ' , but ')
    .replace(/\s+however\s+/gi, ' , however ')
    .replace(/\s+although\s+/gi, ' , although ')
    .replace(/\s+though\s+/gi, ' , though ')
    .replace(/\s+yet\s+/gi, ' , yet ')
    .replace(/\s+while\s+/gi, ' , while ')
    .replace(/\s+still\s+/gi, ' , still ')
    .replace(/\s+now\s+/gi, ' , now ')
    .replace(/\s+today\s+/gi, ' , today ')
    .replace(/\s+lekin\s+/gi, ' , lekin ')
    .replace(/\s+magar\s+/gi, ' , magar ')
    .replace(/\s+par\s+/gi, ' , par ')
    .replace(/\s+phir bhi\s+/gi, ' , phir bhi ');
}

function containsHindiText(text: string): boolean {
  if (!text) return false;
  let devanagariCount = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0900 && code <= 0x097F) devanagariCount++;
  }
  return devanagariCount > text.length * 0.2;
}

function detectHinglish(text: string): boolean {
  const hinglishMarkers = [
    'hun', 'hoon', 'hai', 'hain', 'tha', 'thi', 'the',
    'raha', 'rahi', 'rahe', 'gaya', 'gayi', 'gaye',
    'karna', 'karta', 'karti', 'kar', 'karo', 'kiya',
    'kya', 'nahi', 'nahin', 'nai', 'bahut', 'bohot', 'bahot',
    'acha', 'accha', 'aur', 'bhi', 'toh', 'to', 'yaar',
    'bhai', 'kal', 'aaj', 'zyada', 'thoda', 'bilkul',
    'ekdum', 'sahi', 'matlab', 'lag', 'laga',
    'mujhe', 'mera', 'meri', 'mere', 'hum', 'tum',
    'unhe', 'unka', 'unki', 'inhe', 'iska', 'iski',
    'please', 'yeh', 'woh', 'koi', 'kuch', 'sab',
    'marks', 'result', 'rank', 'percentile', 'cutoff',
  ];
  let matches = 0;
  const lowerText = text.toLowerCase();
  for (const marker of hinglishMarkers) {
    const regex = new RegExp(`(^|\\s)${marker}(\\s|$|[,\\.])`, 'i');
    if (regex.test(lowerText)) {
      matches++;
      if (matches >= 2) return true;
    }
  }
  return false;
}

function isNegated(text: string, wordIdx: number): boolean {
  // Extract clause window — max 65 chars lookback within clause
  const clausePattern = /[,;\.\!\?\u0964]|(\s+(but|however|although|yet|while|though|still|now|today|lekin|magar|par|phir bhi)\s+)/i;
  let clauseStart = 0;
  const substr = text.substring(0, wordIdx);
  
  // Find the last match of a clause boundary
  const matches = [...substr.matchAll(new RegExp(clausePattern, 'gi'))];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    clauseStart = (lastMatch.index !== undefined ? lastMatch.index : 0) + lastMatch[0].length;
  }

  const windowStart = Math.max(clauseStart, wordIdx - 65);
  const clauseWindow = text.substring(windowStart, wordIdx).toLowerCase().trim();

  if (clauseWindow.length === 0) return false;

  for (const neg of NEGATORS) {
    const negPattern = new RegExp(`(^|\\s)${escapeRegExp(neg)}(\\s|$|[,\\.\\!?])`, 'i');
    if (negPattern.test(clauseWindow)) return true;
  }
  return false;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function getIntensityMultiplier(text: string, wordIdx: number): number {
  const windowStart = Math.max(0, wordIdx - 20);
  const window = text.substring(windowStart, wordIdx).toLowerCase();

  for (const amp of AMPLIFIERS) {
    if (window.includes(amp)) return 1.5;
  }
  for (const dim of DIMINISHERS) {
    if (window.includes(dim)) return 0.5;
  }
  return 1.0;
}

function getOppositeCategory(category: string): string {
  switch (category) {
    case 'joy': return 'sadness';
    case 'sadness': return 'joy';
    case 'anger': return 'sadness';
    case 'fear': return 'fatigue';
    case 'fatigue': return 'joy';
    default: return 'joy';
  }
}

function extractContextWindow(fullText: string, idx: number, wordLen: number): string {
  const start = Math.max(0, idx - 10);
  const end = Math.min(fullText.length, idx + wordLen + 10);
  let snippet = fullText.substring(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < fullText.length) snippet = snippet + '...';
  return snippet;
}

function extractKeyPhrases(_text: string, triggers: EmotionTrigger[]): string[] {
  const phrases: string[] = [];
  const sorted = [...triggers]
    .filter(t => !t.negated && t.weight > 0)
    .sort((a, b) => b.weight - a.weight);
    
  for (const t of sorted.slice(0, 3)) {
    if (!phrases.includes(t.word)) phrases.push(t.word);
  }
  return phrases;
}

function categoryToEmotionLabel(category: string): string {
  switch (category) {
    case 'joy': return 'Joy';
    case 'sadness': return 'Sadness';
    case 'anger': return 'Anger';
    case 'fear': return 'Apprehension';
    case 'fatigue': return 'Fatigue';
    default: return 'Contemplation';
  }
}

function emotionLabelToCategory(emotion: string): string {
  switch (emotion) {
    case 'Joy': return 'joy';
    case 'Sadness': return 'sadness';
    case 'Anger': return 'anger';
    case 'Apprehension': return 'fear';
    case 'Fatigue': return 'fatigue';
    default: return 'joy';
  }
}

/* ── Main AI Pipeline ── */

export async function detectEmotion(
  journalText: string, 
  selectedEmotion?: string, 
  healthData?: HealthContext, 
  wordOverrides?: Record<string, Record<string, number>>
): Promise<EmotionResult> {
  const normalizedText = journalText.replace(/‘/g, "'").replace(/’/g, "'").replace(/`/g, "'");
  const processedText = insertSoftBoundaries(normalizedText);
  const lowerText = processedText.toLowerCase();

  let sleepHours = 8;
  if (healthData && healthData.sleep_duration_hours !== undefined) {
    sleepHours = healthData.sleep_duration_hours;
  }

  let predefinedBucket: string | undefined;
  if (selectedEmotion) {
    predefinedBucket = LEXICON_TAG_MAP[selectedEmotion.toLowerCase()];
  }

  const scores: Record<string, number> = { joy: 0, sadness: 0, anger: 0, fear: 0, fatigue: 0 };
  const triggers: EmotionTrigger[] = [];

  const hasDevanagari = containsHindiText(journalText);
  const isHinglish = detectHinglish(lowerText);

  // Phase 0: Multilingual Phrase Match
  if (hasDevanagari || isHinglish) {
    const multiPhrases = hasDevanagari ? HINDI_DEVANAGARI_PHRASES : HINGLISH_PHRASES;
    for (const [category, phraseList] of Object.entries(multiPhrases)) {
      for (const phrase of phraseList) {
        const searchIn = hasDevanagari ? journalText : lowerText;
        if (searchIn.includes(phrase)) {
          scores[category] = (scores[category] || 0) + 2.5;
          triggers.push({ word: phrase, category, startIndex: searchIn.indexOf(phrase), endIndex: searchIn.indexOf(phrase) + phrase.length, weight: 2.5, negated: false });
        }
      }
    }
  }

  // Phase 0.5: Multilingual Vocabulary Match
  if (hasDevanagari || isHinglish) {
    const multiLexicon = hasDevanagari ? HINDI_LEXICON : HINGLISH_LEXICON;
    for (const [category, wordList] of Object.entries(multiLexicon)) {
      for (const w of wordList) {
        const searchIn = hasDevanagari ? journalText : lowerText;
        const searchWord = hasDevanagari ? w : w.toLowerCase();
        let searchFrom = 0;
        while (true) {
          const idx = searchIn.indexOf(searchWord, searchFrom);
          if (idx === -1) break;
          const charBefore = idx > 0 ? searchIn[idx - 1] : ' ';
          const endIdx = idx + searchWord.length;
          const charAfter = endIdx < searchIn.length ? searchIn[endIdx] : ' ';
          const isWordBound = !/[a-zA-Z]/.test(charBefore) && !/[a-zA-Z]/.test(charAfter);
          
          if (isWordBound) {
            scores[category] = (scores[category] || 0) + 1.5;
            triggers.push({ word: w, category, startIndex: idx, endIndex: endIdx, weight: 1.5, negated: false });
          }
          searchFrom = endIdx;
        }
      }
    }
  }

  // Phase 1: English Phrases
  for (const [category, phraseList] of Object.entries(PHRASES)) {
    for (const phrase of phraseList) {
      let searchFrom = 0;
      while (true) {
        const idx = lowerText.indexOf(phrase, searchFrom);
        if (idx === -1) break;
        scores[category] = (scores[category] || 0) + 2.0;
        triggers.push({ word: journalText.substring(idx, Math.min(idx + phrase.length, journalText.length)).trim(), category, startIndex: idx, endIndex: Math.min(idx + phrase.length, journalText.length), weight: 2.0, negated: false });
        searchFrom = idx + phrase.length;
      }
    }
  }

  // Phase 2: English Words + Negation
  for (const [category, wordList] of Object.entries(LEXICON)) {
    for (const w of wordList) {
      let searchFrom = 0;
      while (true) {
        const idx = lowerText.indexOf(w, searchFrom);
        if (idx === -1) break;
        
        const negated = isNegated(lowerText, idx);
        const multiplier = getIntensityMultiplier(lowerText, idx);

        if (negated) {
          scores[category] = (scores[category] || 0) - 0.5;
          const opposite = getOppositeCategory(category);
          scores[opposite] = (scores[opposite] || 0) + 0.7;
          triggers.push({ word: extractContextWindow(journalText, idx, w.length), category, startIndex: idx, endIndex: Math.min(idx + w.length, journalText.length), weight: -0.5, negated: true });
        } else {
          const score = 1.0 * multiplier;
          scores[category] = (scores[category] || 0) + score;
          triggers.push({ word: extractContextWindow(journalText, idx, w.length), category, startIndex: idx, endIndex: Math.min(idx + w.length + 2, journalText.length), weight: score, negated: false });
        }
        searchFrom = idx + w.length;
      }
    }
  }

  // Phase 2.3: Contrastive Conjunction Reweighting
  const contrastiveWords = ['but', 'however', 'although', 'though', 'yet', 'lekin', 'magar', 'par', 'phir bhi'];
  let contrastIdx = -1;
  for (const cw of contrastiveWords) {
    const idx = lowerText.lastIndexOf(` ${cw} `);
    if (idx > contrastIdx) contrastIdx = idx;
  }
  if (contrastIdx > 0) {
    for (const trigger of triggers) {
      if (trigger.startIndex < contrastIdx) {
        scores[trigger.category] = (scores[trigger.category] || 0) - trigger.weight * 0.6;
      } else {
        const boostWeight = Math.abs(trigger.weight) * 0.6;
        if (trigger.negated) {
          const opp = getOppositeCategory(trigger.category);
          scores[opp] = (scores[opp] || 0) + boostWeight;
        } else {
          scores[trigger.category] = (scores[trigger.category] || 0) + boostWeight;
        }
      }
    }
  }

  // Phase 2.5: Adaptive Learning
  let adaptiveActive = false;
  if (wordOverrides && Object.keys(wordOverrides).length > 0) {
    for (const trigger of triggers) {
      const wordKey = trigger.word.toLowerCase().trim();
      for (const overrideKey of Object.keys(wordOverrides)) {
        if (wordKey.includes(overrideKey.toLowerCase())) {
          const corrections = wordOverrides[overrideKey];
          for (const [emotionLabel, count] of Object.entries(corrections)) {
            if (count >= 5) {
              const category = emotionLabelToCategory(emotionLabel);
              scores[category] = (scores[category] || 0) + 2.5;
              adaptiveActive = true;
            }
          }
        }
      }
    }
  }

  // Phase 3: Health context adjustments
  if (sleepHours < 6) {
    scores['fatigue'] = (scores['fatigue'] || 0) + 3.0;
    scores['fear'] = (scores['fear'] || 0) + 1.0;
    scores['sadness'] = (scores['sadness'] || 0) + 1.0;
    if (!predefinedBucket && (scores['fatigue'] || 0) > 4) {
      predefinedBucket = 'Fatigue';
    }
  }

  for (const key of Object.keys(scores)) {
    if (scores[key] < 0) scores[key] = 0;
  }

  // Phase 4: Primary Emotion + BERT Integration
  // Now uses Flutter's exact TFLite models (emotion_model_en/hi.tflite) via bertEngine.ts
  // Pipeline: BERT → Context Personalization → User Feedback (exact Flutter order)
  let primaryEmotion = predefinedBucket || 'Contemplation';
  let maxScore = 0;
  const totalHits = Object.values(scores).reduce((a, b) => a + b, 0);

  let bertScores: { label: string; score: number }[] = [];
  let bertMethod = 'nlp-only';

  try {
    if (journalText && journalText.trim().length >= 3) {
      // STEP 1-3: Flutter TFLite BERT pipeline (bertEngine.ts)
      const { analyzePipeline } = await import('./bertEngine');
      const profile = { occupation: (wordOverrides as any)?._occupation, dailyStressors: (wordOverrides as any)?._stressors };
      const cleanOverrides = { ...wordOverrides };
      delete (cleanOverrides as any)._occupation;
      delete (cleanOverrides as any)._stressors;

      const bertResult = await analyzePipeline(journalText, profile, cleanOverrides);
      bertMethod = bertResult.method;

      // Convert Flutter BERT probabilities → bertScores array for compatibility
      bertScores = Object.entries(bertResult.scores).map(([label, score]) => ({
        label: label === 'fear' ? 'Apprehension' : label.charAt(0).toUpperCase() + label.slice(1),
        score
      }));

      // Fuse TFLite BERT scores into NLP lexicon scores
      // Flutter weight: BERT provides the base, NLP is the refinement layer
      if (!predefinedBucket) {
        for (const [cat, prob] of Object.entries(bertResult.scores)) {
          scores[cat] = (scores[cat] || 0) + (prob * 5.0); // 5x weight — BERT is the primary signal
        }
      }
    }
  } catch (e) {
    // Fallback: use HuggingFace DistilBERT if TFLite unavailable
    try {
      if (journalText && journalText.trim().length >= 3) {
        const classifier = await getClassifier();
        if (classifier) {
          const results = await classifier(journalText, { top_k: 6 }) as { label: string; score: number }[];
          bertScores = results.map(r => ({
            label: EMOTION_MAP[r.label.toLowerCase()] || r.label,
            score: r.score
          }));
          bertMethod = 'hf-distilbert-fallback';
          if (!predefinedBucket) {
            for (const bs of bertScores) {
              const cat = emotionLabelToCategory(bs.label);
              scores[cat] = (scores[cat] || 0) + (bs.score * 3.0);
            }
          }
        }
      }
    } catch { /* NLP-only mode */ }
  }

  if (!predefinedBucket) {
    for (const [key, value] of Object.entries(scores)) {
      if (value > maxScore) {
        maxScore = value;
        primaryEmotion = categoryToEmotionLabel(key);
      }
    }
  } else {
    maxScore = Math.max(...Object.values(scores), 0);
  }

  // Phase 5: Confidence
  let confidence = 0.45;
  if (predefinedBucket) {
    confidence = 0.92;
  } else if (totalHits > 0 && maxScore > 0) {
    const sortedVals = Object.values(scores).sort((a, b) => b - a);
    const separation = sortedVals.length >= 2 ? (sortedVals[0] - sortedVals[1]) / Math.max(1, sortedVals[0]) : 0.8;
    confidence = Math.min(0.95, 0.40 + separation * 0.35 + Math.min(0.20, maxScore * 0.04));
  }

  // Generate insights
  const keyPhrases = extractKeyPhrases(journalText, triggers);
  const insights = generateInsights(primaryEmotion, scores, sleepHours, keyPhrases);

  const methodArgs = [
    'lexicon', 'rules', 'negation', bertMethod,
    adaptiveActive ? 'adaptive' : '',
    hasDevanagari ? 'hindi' : '',
    isHinglish ? 'hinglish' : ''
  ].filter(Boolean).join('+');

  return {
    emotion: primaryEmotion, // Backward compatibility
    primaryEmotion,
    intensityScore: insights.score,
    confidence,
    method: methodArgs,
    reflectionPrompt: insights.prompt,
    awarenessInsight: insights.insight,
    triggers: triggers.filter(t => !t.negated),
    scores,
    vocabularyNote: insights.vocabularyNote,
    allScores: bertScores
  };
}

/* ── Context-Aware Insight Generation ── */

function generateInsights(primaryEmotion: string, scores: Record<string, number>, sleepHours: number, keyPhrases: string[]) {
  let finalScore = 5;
  let prompt = '';
  let insight = '';
  let vocabularyNote: string | undefined;
  
  const userContext = keyPhrases.length > 0 
    ? `You wrote about "${keyPhrases[0]}"` 
    : 'Your reflection';

  const randomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  switch (primaryEmotion) {
    case 'Joy':
      finalScore = Math.min(10, 7 + Math.min(3, Math.round(scores['joy'] || 0)));
      prompt = randomItem([
        `${userContext} sounds like it carries real warmth. What specifically made that moment stand out for you?`,
        "There's something genuinely bright here. What conditions helped this positive feeling emerge?",
        `${userContext} — that's worth pausing on. How might you create space for more of this in your week?`,
      ]);
      insight = randomItem([
        "Your words carry a lightness that suggests genuine contentment. Anchoring these moments helps you build a personal inventory of what actually works for your wellbeing.",
        "The positive energy in your reflection isn't superficial — it reflects a real shift. Noticing what sparks this helps you recognize your own patterns.",
        "Joy often hides in specific details. The fact that you noticed and wrote about it means you're already building the muscle of positive awareness.",
      ]);
      vocabularyNote = "Joy is more than happiness — it often signals alignment between what you value and what you are experiencing.";
      break;

    case 'Anger':
      finalScore = Math.max(1, 3 - Math.min(2, Math.round(scores['anger'] || 0)));
      prompt = randomItem([
        `${userContext} — that frustration has real energy behind it. Would you like to explore what boundary this feeling might be protecting?`,
        "The intensity in your words is striking. What would it look like to channel this energy into one concrete action today?",
        `${userContext} is clearly weighing on you. If this anger could speak, what would it ask for?`,
      ]);
      insight = randomItem([
        "Frustration this strong is rarely about the surface event. It often signals a boundary that's being crossed or a value that's being ignored.",
        "The heat in your words suggests something important is at stake. Anger, when examined without judgment, can be a surprisingly useful compass.",
        "Your reaction carries real conviction. That conviction — separate from the frustration — might be telling you something worth listening to.",
      ]);
      if (sleepHours < 6) {
        insight = `With only ${sleepHours} hours of sleep, your emotional threshold is significantly lower. The frustration you're experiencing is being amplified by physiological exhaustion.`;
      }
      vocabularyNote = "Anger frequently guards a boundary or a value being crossed. Beneath most anger, there is something that mattered.";
      break;

    case 'Sadness':
      finalScore = Math.max(2, 5 - Math.min(3, Math.round(scores['sadness'] || 0)));
      prompt = randomItem([
        `${userContext} — there's real tenderness here. What does this feeling need from you right now?`,
        "Your words carry a weight that suggests something meaningful beneath the surface. What part of this would feel good to name out loud?",
        `${userContext} resonates with something deep. If you could send a message to yourself yesterday, what would you say?`,
      ]);
      insight = randomItem([
        "The vulnerability in your reflection takes courage. Sadness often signals that something mattered deeply — your willingness to sit with it shows real self-awareness.",
        "Heavy feelings like these are your psyche processing something important. The fact that you're writing about it rather than pushing it away is significant.",
      ]);
      vocabularyNote = "Sadness often signals that something mattered deeply to you. It is the emotional cost of caring.";
      break;

    case 'Apprehension':
      finalScore = Math.max(2, 4 - Math.min(2, Math.round(scores['fear'] || 0)));
      prompt = randomItem([
        `${userContext} — the anxiety in your words is palpable. What's one thing you can completely release control of today?`,
        "Your mind seems to be running multiple scenarios at once. What would feel different if you allowed just this moment to be enough?",
      ]);
      insight = randomItem([
        "The tension you're describing is your nervous system scanning for threats. Noticing this pattern is itself a powerful form of regulation.",
        "Anxiety often disguises itself as productivity or vigilance. The racing quality in your thoughts suggests your system is in protective mode.",
      ]);
      if (sleepHours < 6) {
        insight = `With only ${sleepHours} hours of sleep, your nervous system is running on high alert. The anxiety you feel has a significant physiological component.`;
      }
      vocabularyNote = "Apprehension often shows up as a tightening in the chest or a racing mind before uncertain situations — your body scanning for threats.";
      break;

    case 'Fatigue':
      finalScore = 4;
      if (sleepHours < 6) {
        prompt = randomItem([
          `Your tracker shows only ${sleepHours} hours of rest. How is that physical exhaustion showing up in your emotional world today?`,
          `Running on ${sleepHours} hours is unsustainable. Would you like to try a micro-experiment: what's one thing you could skip tonight to reclaim 30 minutes of rest?`,
        ]);
        insight = `Your body is sending a clear signal with only ${sleepHours} hours of sleep. This level of fatigue fundamentally alters how you process emotions.`;
      } else {
        prompt = `${userContext} — your body might be asking for something beyond physical rest. When was the last time you rested without guilt?`;
        insight = "Fatigue isn't always about sleep hours — emotional labor, hypervigilance, and sustained stress all drain the same battery. Your system is asking for recalibration.";
      }
      vocabularyNote = "Fatigue is not just physical tiredness. Emotional labor, decision fatigue, and sustained stress all drain the same inner battery.";
      break;

    default:
      finalScore = 5;
      prompt = `${userContext} suggests you're in a reflective space. What would it look like to give yourself permission to just feel whatever is here?`;
      insight = "Sometimes the most important feelings resist clean labels. The fact that you sat down to write is itself a meaningful act of self-awareness.";
      vocabularyNote = "Contemplation allows multiple conflicting emotions to exist alongside each other without forcing a resolution.";
  }

  return { score: finalScore, prompt, insight, vocabularyNote };
}

/* ── Suggest Rich Vocabulary ── */
export function suggestVocabulary(text: string): string[] {
  const VOCAB_MAP: Record<string, string[]> = {
    weird: ['uneasy', 'overwhelmed', 'restless', 'uncertain', 'disconnected'],
    bad: ['drained', 'frustrated', 'defeated', 'hopeless', 'resentful'],
    sad: ['melancholic', 'grieving', 'lonely', 'heartbroken', 'dejected'],
    angry: ['furious', 'resentful', 'irritated', 'bitter', 'exasperated'],
    scared: ['anxious', 'terrified', 'vulnerable', 'panicked', 'insecure'],
    happy: ['elated', 'content', 'blissful', 'grateful', 'euphoric'],
    tired: ['exhausted', 'drained', 'burnt out', 'fatigued', 'overwhelmed'],
    stressed: ['overwhelmed', 'pressured', 'tense', 'strained', 'burdened'],
    good: ['content', 'peaceful', 'fulfilled', 'optimistic', 'energized'],
    fine: ['steady', 'composed', 'neutral', 'indifferent', 'settled'],
    okay: ['managing', 'coping', 'stable', 'getting by', 'holding on'],
    lost: ['confused', 'directionless', 'disoriented', 'unmoored', 'adrift'],
    stuck: ['stagnant', 'trapped', 'paralyzed', 'powerless', 'immobilized'],
    lonely: ['isolated', 'abandoned', 'disconnected', 'withdrawn', 'invisible'],
    nervous: ['apprehensive', 'on edge', 'jittery', 'unsettled', 'tense'],
    confused: ['uncertain', 'bewildered', 'conflicted', 'torn', 'muddled'],
    empty: ['numb', 'hollow', 'detached', 'void', 'apathetic'],
    overwhelmed: ['swamped', 'crushed', 'suffocated', 'buried', 'flooded'],
  };

  const lower = text.toLowerCase();
  const suggestions: string[] = [];
  for (const [trigger, words] of Object.entries(VOCAB_MAP)) {
    const patterns = [
      `feel ${trigger}`, `feeling ${trigger}`, `felt ${trigger}`,
      `i'm ${trigger}`, `i am ${trigger}`, `so ${trigger}`, `really ${trigger}`
    ];
    if (patterns.some((p) => lower.includes(p)) || lower.split(/\\s+/).includes(trigger)) {
      suggestions.push(...words);
    }
  }
  return [...new Set(suggestions)].slice(0, 5);
}

/* ── Original Reflection Prompts (Legacy Support) ── */
export function getReflectionPrompt(emotion: string): string {
  const REFLECTION_PROMPTS: Record<string, string[]> = {
    stress: ['You mentioned feeling overwhelmed. Would you like to reflect on what caused it?'],
    anxious: ['What specifically is making you feel uneasy?'],
    sadness: ['It is okay to feel this way. What do you think triggered this feeling?'],
    joy: ['What contributed most to your happiness today?'],
    excited: ['What is fueling your excitement right now?'],
    grateful: ['What are you most grateful for today?'],
    neutral: ['How did your body feel today?'],
    calm: ['What helped you feel peaceful today?'],
  };
  const prompts = REFLECTION_PROMPTS[emotion.toLowerCase()] || REFLECTION_PROMPTS['neutral'];
  return prompts[0];
}
