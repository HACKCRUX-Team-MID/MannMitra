import 'dart:math';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final llmServiceProvider = Provider<LLMService>((ref) {
  return LLMService();
});

/// Represents a single word/phrase span that triggered an emotion detection.
class EmotionTrigger {
  final String word;
  final String category;
  final int startIndex;
  final int endIndex;
  final double weight; // How much this trigger contributed
  final bool negated; // Was this trigger negated?
  EmotionTrigger({required this.word, required this.category, required this.startIndex, required this.endIndex, this.weight = 1.0, this.negated = false});
  Map<String, dynamic> toJson() => {'word': word, 'category': category, 'start': startIndex, 'end': endIndex, 'weight': weight, 'negated': negated};
}

/// Full result of the on-device emotion detection pipeline.
class EmotionResult {
  final String primaryEmotion;
  final int intensityScore;
  final double confidence;
  final String method;
  final String reflectionPrompt;
  final String awarenessInsight;
  final List<EmotionTrigger> triggers;
  final Map<String, double> scores;
  final String? vocabularyNote;

  EmotionResult({
    required this.primaryEmotion,
    required this.intensityScore,
    required this.confidence,
    this.method = 'lexicon+rules+negation',
    required this.reflectionPrompt,
    required this.awarenessInsight,
    required this.triggers,
    required this.scores,
    this.vocabularyNote,
  });

  Map<String, dynamic> toJson() => {
    'primary_emotion': primaryEmotion,
    'intensity_score': intensityScore,
    'confidence': confidence,
    'method': method,
    'reflection_prompt': reflectionPrompt,
    'awareness_insight': awarenessInsight,
    'triggers': triggers.map((t) => t.toJson()).toList(),
    'scores': scores,
    'vocabulary_note': vocabularyNote,
  };
}

class LLMService {
  // ══════════════════════════════════════════════════════════════
  //  HINGLISH ROMANIZED PHRASE LEXICON — For Indian users typing in Roman script
  //  Sourced from vocabulary patterns in SemEval-2020 Task 9 code-mixed tweets
  //  manually mapped to MannMitra's 6 emotion categories (Change 8)
  // ══════════════════════════════════════════════════════════════
  static const Map<String, List<String>> _hinglishPhrases = {
    'sadness': [
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
    'anger': [
      'bahut gussa aa raha hai', 'itna gussa hai mujhe', 'bilkul sahi nahi',
      'bada bura laga yaar', 'naraaz hun', 'tang aa gaya hun',
      'bohot bura kiya unhone', 'galat hai ye bilkul', 'chilla diya',
      'kyu karte hain aisa', 'itna unfair kyun', 'mujhse bhi puchha hota',
      'meri baat suno kabhi', 'bakwaas bandh karo',
      'itna gussa kyu dilate ho', 'dimag mat khao',
    ],
    'fear': [
      'dar lag raha hai', 'tension ho rahi hai', 'kal exam hai',
      'bahut pressure hai', 'pata nahi kya hoga', 'ghabra raha hun',
      'nind nahi aa rahi', 'zyada tension ho gayi', 'pareshan hun bahut',
      'result ka dar hai', 'kya hoga mera', 'sochke hi darna lagta hai',
      'anxiety ho rahi hai', 'kuch hoga toh nahi', 'sab theek hoga na',
      'jee ka result aayega', 'board mein kya hoga', 'merit mein aaunga',
      'parents ko kya bataunga', 'log kya kahenge', 'society mein face kaise karunga',
      'career kharab ho jayega', 'future nahi dikh raha',
    ],
    'joy': [
      'bahut acha laga', 'khush hun yaar', 'maja aa gaya',
      'best din tha aaj', 'bahut accha hua', 'dil khush hai',
      'mast feel ho raha', 'sab theek ho gaya', 'itna acha laga',
      'khushi ho rahi hai', 'dil bhaara hua hai acche se',
      'proud feel kar raha hun', 'finally kar diya', 'ho gaya yaar',
      'selected ho gaya', 'pass kar gaya', 'rank aayi',
      'acha score aaya', 'family khush hai', 'sab ne appreciate kiya',
    ],
    'fatigue': [
      'bahut thak gaya hun', 'nind aa rahi hai', 'energy nahi hai bilkul',
      'kuch karne ka mann nahi', 'so jaana chahta hun', 'bahut zyada thak gaya',
      'kaam nahi kar pa raha', 'thaka hua hun', 'bas karna hai',
      'aur nahi hoga', 'haare hain hum', 'uth nahi pa raha',
      'sab kuch ek jaisa lag raha', 'routine boring ho gayi',
      'kuch feel nahi ho raha', 'sab numbness lag raha',
    ],
  };

  // ══════════════════════════════════════════════════════════════
  //  HINDI DEVANAGARI PHRASE LEXICON — For users typing in Hindi script
  //  Covers core emotional expressions in formal Hindi (Change 9)
  // ══════════════════════════════════════════════════════════════
  static const Map<String, List<String>> _hindiDevanagariPhrases = {
    'sadness': [
      'बहुत बुरा लगा', 'दिल भारी है', 'रोना आ रहा है',
      'बहुत दुख हुआ', 'अकेला महसूस हो रहा हूँ',
      'कुछ अच्छा नहीं लग रहा', 'टूट गया हूँ',
      'दिल टूट गया', 'कोई नहीं है मेरे लिए',
    ],
    'anger': [
      'बहुत गुस्सा आ रहा है', 'इतना गुस्सा है',
      'बिल्कुल सही नहीं', 'नाराज़ हूँ', 'तंग आ गया हूँ',
      'बहुत बुरा किया', 'गलत है यह',
    ],
    'fear': [
      'डर लग रहा है', 'बहुत टेंशन है', 'घबरा रहा हूँ',
      'परेशान हूँ', 'पता नहीं क्या होगा',
      'नींद नहीं आ रही', 'भविष्य नहीं दिख रहा',
      'परिणाम का डर है', 'माता-पिता को क्या बताऊँगा',
    ],
    'joy': [
      'बहुत अच्छा लगा', 'खुश हूँ', 'दिल खुश है',
      'बहुत अच्छा हुआ', 'गर्व महसूस हो रहा है',
      'आखिरकार हो गया', 'चुना गया',
    ],
    'fatigue': [
      'बहुत थक गया हूँ', 'नींद आ रही है', 'ऊर्जा नहीं है',
      'कुछ करने का मन नहीं', 'बस करना है यह सब',
      'उठ नहीं पा रहा', 'सब कुछ एक जैसा लग रहा है',
    ],
  };

  // ══════════════════════════════════════════════════════════════
  //  HINGLISH SINGLE-WORD LEXICON — catches individual emotional words
  //  These fire at 1.5x weight (between English 1.0x and phrase 2.5x)
  //  Prevents Introspection fallback when phrases don't match exactly
  // ══════════════════════════════════════════════════════════════
  static const Map<String, List<String>> _hinglishLexicon = {
    'sadness': [
      'dukh', 'dukhi', 'udaas', 'udasi', 'rona', 'roye', 'ro',
      'tanha', 'akela', 'akeli', 'akelapan', 'toota', 'tooti', 'toot',
      'bikhar', 'khoye', 'khoya', 'kho', 'dard', 'takleef', 'taklif',
      'bura', 'buri', 'mushkil', 'tootna', 'dhundla',
      'disappoint', 'miss', 'yaad', 'shikayat',
      'fail', 'haar', 'haara', 'haari', 'kamzor', 'kamzori',
    ],
    'anger': [
      'gussa', 'gusse', 'naraaz', 'naraz', 'chidh', 'chidha',
      'jhunjhla', 'irritate', 'khafa', 'tang', 'aakrosh',
      'galat', 'unfair', 'bura', 'chilla', 'chillana',
      'ladai', 'jhagda', 'jhagra', 'beizzat', 'insult',
      'zulm', 'anyay', 'nafrat', 'ghrina',
    ],
    'fear': [
      'dar', 'darr', 'dara', 'dari', 'darna', 'ghabra', 'ghabrahat',
      'tension', 'pareshan', 'pareshaan', 'pareshani', 'chinta',
      'fikr', 'fikar', 'behla', 'pressure', 'exam', 'result',
      'anxiety', 'nervous', 'panic', 'stress',
      'uncertain', 'confused', 'doubt', 'shaq', 'ashanka',
    ],
    'joy': [
      'khush', 'khushi', 'acha', 'accha', 'aachi', 'maja', 'mazaa',
      'hasna', 'hasi', 'muskura', 'muskaan', 'pyar', 'pyaar',
      'proud', 'garv', 'jeet', 'jeeta', 'jeeti', 'kamyab', 'kamyabi',
      'safal', 'safalta', 'shaandar', 'badhiya', 'zabardast',
      'mast', 'chill', 'sukh', 'sukoon', 'chain', 'anand',
      'pass', 'selected', 'topper', 'rank',
    ],
    'fatigue': [
      'thak', 'thaka', 'thaki', 'thakaan', 'thakavat',
      'neend', 'nind', 'soya', 'soye', 'aalas', 'aalsi',
      'susti', 'sust', 'uthna', 'uth', 'energy',
      'boring', 'bore', 'uktana', 'numb', 'sab', 'khatam',
      'bas', 'haara', 'haar', 'kamzor', 'kamzori',
    ],
  };

  // ══════════════════════════════════════════════════════════════
  //  HINDI DEVANAGARI SINGLE-WORD LEXICON
  //  Catches individual Hindi emotional words at 1.5x weight
  // ══════════════════════════════════════════════════════════════
  static const Map<String, List<String>> _hindiLexicon = {
    'sadness': [
      'दुख', 'दुखी', 'उदास', 'उदासी', 'रोना', 'रोया', 'रोई',
      'तनहा', 'अकेला', 'अकेली', 'अकेलापन', 'टूट', 'टूटा', 'टूटी',
      'बिखर', 'दर्द', 'तकलीफ', 'पीड़ा', 'कष्ट', 'शिकायत',
      'निराशा', 'निराश', 'हार', 'हारा', 'असफल', 'असफलता',
      'बुरा', 'मुश्किल', 'याद', 'ग्लानि',
    ],
    'anger': [
      'गुस्सा', 'गुस्से', 'नाराज़', 'नाराज', 'चिढ़', 'खफा',
      'क्रोध', 'आक्रोश', 'गलत', 'बेइज्जत', 'अपमान',
      'ज़ुल्म', 'अन्याय', 'नफरत', 'घृणा', 'लड़ाई', 'झगड़ा',
    ],
    'fear': [
      'डर', 'डरा', 'डरी', 'डरना', 'घबरा', 'घबराहट',
      'टेंशन', 'परेशान', 'परेशानी', 'चिंता', 'फिक्र',
      'दबाव', 'तनाव', 'आशंका', 'भय', 'संदेह',
      'अनिश्चित', 'अनिश्चितता',
    ],
    'joy': [
      'खुश', 'खुशी', 'अच्छा', 'अच्छी', 'मजा', 'मज़ा',
      'हँसी', 'हंसना', 'मुस्कान', 'प्यार',
      'गर्व', 'जीत', 'जीता', 'कामयाब', 'कामयाबी',
      'सफल', 'सफलता', 'शानदार', 'बढ़िया', 'ज़बरदस्त',
      'सुख', 'सुकून', 'चैन', 'आनंद', 'मस्त',
    ],
    'fatigue': [
      'थक', 'थका', 'थकी', 'थकान', 'थकावट',
      'नींद', 'आलस', 'आलसी', 'सुस्त', 'सुस्ती',
      'ऊर्जा', 'बोर', 'बोरियत', 'ऊब',
      'बस', 'खत्म', 'हार', 'कमज़ोर', 'कमज़ोरी',
    ],
  };

  // ══════════════════════════════════════════════════════════════
  //  ENHANCED LEXICON — Multi-word phrases scored higher (2.0x)
  // ══════════════════════════════════════════════════════════════
  static const Map<String, List<String>> _phrases = {
    'joy': ['feel good', 'feeling great', 'so happy', 'really proud', 'made my day', 'best day', 'looking forward', 'went well', 'turned out great', 'feel blessed', 'feel grateful', 'beautiful day', 'so excited', 'can\'t wait', 'fell in love', 'good news', 'finally worked', 'it worked', 'nailed it', 'got through', 'feels right'],
    'sadness': ['feel alone', 'no one cares', 'miss them', 'broke down', 'feel empty', 'can\'t stop crying', 'falling apart', 'losing hope', 'giving up', 'not good enough', 'feel worthless', 'let everyone down', 'i failed', 'feel guilty', 'wish i could', 'it hurts', 'heart heavy', 'deeply sad', 'feel like crying', 'feel lost', 'feel hollow', 'bad marks', 'low marks', 'poor marks', 'failed exam', 'didn\'t pass', 'didn\'t score', 'bad grade', 'poor grade', 'low score', 'not good', 'feel bad', 'messed up', 'screwed up', 'let down', 'let myself down'],
    'anger': ['so angry', 'pissed off', 'lost my temper', 'makes me mad', 'can\'t stand', 'fed up', 'sick of', 'had enough', 'blew up', 'screamed at', 'yelled at', 'drives me crazy', 'so unfair', 'not fair', 'how dare', 'lost it', 'furious at', 'hate this', 'hate that'],
    'fear': ['can\'t sleep', 'keep worrying', 'freaking out', 'so stressed', 'panic attack', 'heart racing', 'can\'t breathe', 'feel trapped', 'losing control', 'what if', 'can\'t stop thinking', 'so anxious', 'dreading it', 'feel overwhelmed', 'too much pressure', 'falling behind', 'not ready', 'so nervous', 'scared to', 'afraid of', 'exam stress', 'exam pressure', 'board exams', 'entrance exam', 'result anxiety',
      // Indian academic & family pressure (Change 1)
      'jee pressure', 'neet pressure', 'board exam', 'board result',
      'competitive exam', 'rank anxiety', 'cut off marks',
      'selection pressure', 'merit list', 'placement pressure',
      'semester exam', 'internal marks', 'attendance shortage',
      'parents will be disappointed', 'family pressure', 'log kya kahenge',
      'society pressure', 'rishtedar poochenge', 'future uncertain',
      'career tension', 'kya hoga mera', 'sab fail ho jayega',
      'result ka dar', 'marks nahi aaye', 'fail ho gaya kya',
    ],
    'fatigue': ['so tired', 'burnt out', 'no energy', 'can\'t focus', 'need rest', 'barely awake', 'running on empty', 'feel drained', 'feel heavy', 'nothing left', 'too exhausted', 'brain fog', 'can\'t think', 'body aches', 'slept badly', 'didn\'t sleep', 'stayed up', 'all nighter', 'feel weak',
      // Journaling-tone phrases (Change 2)
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

  static const Map<String, List<String>> _lexicon = {
    'joy': ['happy', 'good', 'grateful', 'joy', 'great', 'wonderful', 'amazing', 'love', 'excit', 'glad', 'proud', 'peace', 'optimistic', 'content', 'reliev', 'blessed', 'thankful', 'win', 'success', 'awesome', 'best', 'smile', 'laugh', 'perfect', 'cheerful', 'delight', 'thrill', 'hope', 'inspir', 'tender', 'warm', 'bright', 'satisfy', 'comfort', 'calm', 'serene', 'bliss', 'ecsta', 'elat', 'uplift', 'celebrat', 'play', 'fun', 'enjoy', 'accomplish'],
    'sadness': ['sad', 'lonely', 'miss', 'cry', 'hurt', 'empty', 'lost', 'alone', 'down', 'depress', 'low', 'vulnerable', 'despair', 'guilty', 'disappoint', 'fail', 'grief', 'sorrow', 'tears', 'broke', 'hopeless', 'numb', 'hollow', 'regret', 'shame', 'wound', 'abandon', 'neglect', 'reject', 'betray', 'mourn', 'ache', 'heavy', 'suffer', 'pain', 'melanchol', 'gloomy', 'helpless', 'worthless', 'defeat', 'marks', 'exam', 'score', 'grade', 'flunk', 'underperform'],
    'anger': ['angry', 'frustrat', 'annoy', 'unfair', 'mad', 'hate', 'furious', 'irritat', 'resent', 'rage', 'pissed', 'fuming', 'livid', 'yell', 'argue', 'scream', 'hostile', 'bitter', 'contempt', 'disgust', 'aggress', 'violent', 'explod', 'snap', 'outrag', 'vengea', 'spite', 'grudge', 'provok', 'combativ', 'defiant', 'rebel', 'stubborn', 'toxic'],
    'fear': ['stress', 'overwhelm', 'pressure', 'anxious', 'worry', 'nervous', 'tense', 'panic', 'scared', 'afraid', 'fear', 'terrified', 'dread', 'uneasy', 'trapped', 'restless', 'agitat', 'paranoi', 'phobia', 'hyperventilat', 'insecur', 'uncertain', 'doubt', 'suspicio', 'apprehens', 'vigilant', 'jitter', 'edgy', 'frantic', 'alarm', 'threat', 'danger', 'risk', 'crisis', 'deadline',
      // Indian academic vocabulary (Change 3)
      'jee', 'neet', 'upsc', 'gate', 'cat', 'clat', 'boards', 'semester',
      'placement', 'internship', 'cutoff', 'percentile', 'rank', 'merit',
      'scholarship', 'reappear', 'backlog', 'arrear', 'supplementary',
      'viva', 'practical', 'attendance', 'detain', 'promotion',
    ],
    'fatigue': ['tired', 'exhaust', 'sleep', 'drain', 'burnout', 'worn', 'weak', 'fatigue', 'energy', 'lazy', 'sluggish', 'letharg', 'drowsy', 'weary', 'deplet', 'overwork', 'grind', 'collaps', 'crash', 'zombie',
      // Informal burnout vocabulary (Change 4)
      'numb', 'hollow', 'disconnected', 'zoned', 'checked out', 'vacant',
      'mechanical', 'robotic', 'flatline', 'depleted', 'running on fumes',
      'burnt', 'fried', 'cooked', 'done', 'spent', 'wiped',
      'demotivat', 'apathi', 'disengag', 'detach', 'switch off',
    ],
  };

  // Negation window — expanded with informal + Hinglish (Change 5)
  static const List<String> _negators = [
    // Standard English
    'not', 'no', 'never', 'don\'t', 'dont', 'didn\'t', 'didnt',
    'wasn\'t', 'wasnt', 'isn\'t', 'isnt', 'aren\'t', 'arent',
    'won\'t', 'wont', 'can\'t', 'cant', 'couldn\'t', 'couldnt',
    'shouldn\'t', 'shouldnt', 'wouldn\'t', 'wouldnt', 'hasn\'t',
    'hasnt', 'haven\'t', 'havent', 'hardly', 'barely', 'neither',
    'nor', 'without', 'lack', 'lacking', 'absence of',
    // Informal English
    'nope', 'nah', 'no way', 'not at all', 'not really', 'not even',
    'never ever', 'far from', 'anything but', 'instead of',
    // Hinglish negators — how users actually type
    'nahi', 'nahin', 'nai', 'mat', 'mujhe nahi', 'bilkul nahi',
    'kabhi nahi', 'na',
  ];

  // Intensity amplifiers — expanded with Hinglish (Change 6)
  static const List<String> _amplifiers = [
    // Existing English
    'very', 'extremely', 'incredibly', 'absolutely', 'deeply', 'really',
    'completely', 'totally', 'so', 'utterly', 'terribly', 'awfully',
    'genuinely', 'profoundly', 'immensely', 'seriously', 'super',
    // Additional English
    'way too', 'way more', 'insanely', 'ridiculously', 'overwhelmingly',
    'devastatingly', 'unbearably', 'desperately',
    // Hinglish amplifiers
    'bahut', 'bahot', 'bohot', 'itna', 'itni', 'kaafi', 'zyada',
    'bada', 'badi', 'ekdum', 'poori tarah', 'bilkul',
  ];

  // Intensity diminishers — expanded with Hinglish (Change 7)
  static const List<String> _diminishers = [
    // Existing English
    'slightly', 'somewhat', 'a bit', 'a little', 'mildly', 'kinda',
    'sorta', 'kind of', 'sort of', 'not very', 'not really', 'barely',
    // Additional English
    'a tad', 'rather', 'fairly', 'pretty much', 'more or less',
    'to some extent', 'a tad bit',
    // Hinglish diminishers
    'thoda', 'thodi', 'thoda sa', 'halka', 'halki', 'kam',
    'utna nahi', 'zyada nahi', 'kuch kuch',
  ];

  // Ground truth mapping from ALL UI Lexicon tags (root + granular)
  static const Map<String, String> _lexiconTagMap = {
    // Root emotions
    'joy': 'Joy', 'sadness': 'Sadness', 'fear': 'Apprehension', 'anger': 'Anger',
    'surprise': 'Contemplation', 'disgust': 'Anger',
    // Joy children
    'peaceful': 'Joy', 'optimistic': 'Joy', 'proud': 'Joy', 'relieved': 'Joy', 'content': 'Joy',
    // Sadness children
    'lonely': 'Sadness', 'vulnerable': 'Sadness', 'despair': 'Sadness',
    'guilty': 'Sadness', 'disappointed': 'Sadness',
    // Fear children
    'anxious': 'Apprehension', 'insecure': 'Apprehension', 'overwhelmed': 'Apprehension',
    'worried': 'Apprehension', 'dread': 'Apprehension',
    // Anger children
    'frustrated': 'Anger', 'resentful': 'Anger', 'annoyed': 'Anger',
    'betrayed': 'Anger', 'irritated': 'Anger',
    // Surprise children
    'confused': 'Contemplation', 'amazed': 'Joy', 'overcome': 'Contemplation', 'stunned': 'Contemplation',
    // Disgust children
    'judgmental': 'Anger', 'appalled': 'Anger', 'revolted': 'Anger', 'averse': 'Anger',
    // Legacy tags
    'contemplation': 'Contemplation', 'ambivalence': 'Contemplation',
    'introspection': 'Contemplation', 'fatigue': 'Fatigue',
  };

  // ══════════════════════════════════════════════════════════
  //  SOFT BOUNDARY INSERTION — Pre-processing for informal text (Change 11)
  //  Inserts soft comma boundaries before conjunction words when no
  //  punctuation exists. Ensures negation scoping for run-on sentences.
  // ══════════════════════════════════════════════════════════
  String _insertSoftBoundaries(String text) {
    // Only process if text lacks natural punctuation
    final hasPunctuation = text.contains(',') ||
        text.contains('.') ||
        text.contains('!') ||
        text.contains('?') ||
        text.contains('\u0964'); // Devanagari danda

    if (hasPunctuation) return text;

    return text
      .replaceAll(RegExp(r'\s+but\s+', caseSensitive: false), ' , but ')
      .replaceAll(RegExp(r'\s+however\s+', caseSensitive: false), ' , however ')
      .replaceAll(RegExp(r'\s+although\s+', caseSensitive: false), ' , although ')
      .replaceAll(RegExp(r'\s+though\s+', caseSensitive: false), ' , though ')
      .replaceAll(RegExp(r'\s+yet\s+', caseSensitive: false), ' , yet ')
      .replaceAll(RegExp(r'\s+while\s+', caseSensitive: false), ' , while ')
      .replaceAll(RegExp(r'\s+still\s+', caseSensitive: false), ' , still ')
      .replaceAll(RegExp(r'\s+now\s+', caseSensitive: false), ' , now ')
      .replaceAll(RegExp(r'\s+today\s+', caseSensitive: false), ' , today ')
      .replaceAll(RegExp(r'\s+lekin\s+', caseSensitive: false), ' , lekin ')
      .replaceAll(RegExp(r'\s+magar\s+', caseSensitive: false), ' , magar ')
      .replaceAll(RegExp(r'\s+par\s+', caseSensitive: false), ' , par ')
      .replaceAll(RegExp(r'\s+phir bhi\s+', caseSensitive: false), ' , phir bhi ');
  }

  /// Primary entry point: 100% on-device analysis with adaptive learning.
  /// Pass `wordOverrides` from LocalStorageService.getWordOverrides() to enable
  /// personalized scoring based on past user corrections.
  EmotionResult analyzeEntry(String journalText, {String? selectedEmotion, Map<String, dynamic>? healthData, Map<String, dynamic>? wordOverrides}) {
    // Normalize curly apostrophes to straight quotes for consistent matching
    final normalizedText = journalText.replaceAll('\u2018', "'").replaceAll('\u2019', "'").replaceAll('\u0060', "'");

    // Inject soft boundaries before negation scanning
    final processedText = _insertSoftBoundaries(normalizedText);
    final lowerText = processedText.toLowerCase();
    final words = lowerText.split(RegExp(r'\s+'));

    // Parse health context
    int sleepHours = 8;
    if (healthData != null && healthData.containsKey('sleep_duration_hours')) {
      sleepHours = (healthData['sleep_duration_hours'] as num?)?.toInt() ?? 8;
    }

    // Ground truth from UI emotion lexicon
    String? predefinedBucket;
    if (selectedEmotion != null) {
      predefinedBucket = _lexiconTagMap[selectedEmotion.toLowerCase()];
    }

    // ══════════════════════════════════════════════════════
    //  PHASE 0: Multilingual — Hinglish + Devanagari Hindi
    // ══════════════════════════════════════════════════════
    final Map<String, double> scores = {'joy': 0, 'sadness': 0, 'anger': 0, 'fear': 0, 'fatigue': 0};
    final List<EmotionTrigger> triggers = [];

    final bool hasDevanagari = containsHindiText(journalText);
    final bool isHinglish = _detectHinglish(lowerText);

    if (hasDevanagari || isHinglish) {
      final multiPhrases = hasDevanagari
          ? _hindiDevanagariPhrases
          : _hinglishPhrases;

      multiPhrases.forEach((category, phraseList) {
        for (var phrase in phraseList) {
          final searchIn = hasDevanagari ? journalText : lowerText;
          if (searchIn.contains(phrase)) {
            scores[category] = (scores[category] ?? 0) + 2.5;
            triggers.add(EmotionTrigger(
              word: phrase,
              category: category,
              startIndex: 0,
              endIndex: phrase.length,
              weight: 2.5,
            ));
          }
        }
      });
    }

    // ══════════════════════════════════════════════════════
    //  PHASE 0.5: Multilingual single-word lexicon scan
    //  Catches individual emotional words that aren't in phrases
    //  Prevents Introspection fallback for unmatched multilingual text
    //  Weight: 1.5x (between English 1.0x and multilingual phrase 2.5x)
    // ══════════════════════════════════════════════════════
    if (hasDevanagari || isHinglish) {
      final multiLexicon = hasDevanagari ? _hindiLexicon : _hinglishLexicon;

      multiLexicon.forEach((category, wordList) {
        for (var w in wordList) {
          final searchIn = hasDevanagari ? journalText : lowerText;
          final searchWord = hasDevanagari ? w : w.toLowerCase();
          int searchFrom = 0;
          while (true) {
            final idx = searchIn.indexOf(searchWord, searchFrom);
            if (idx == -1) break;

            // Word boundary check — prevent partial matches
            final charBefore = idx > 0 ? searchIn[idx - 1] : ' ';
            final endIdx = idx + searchWord.length;
            final charAfter = endIdx < searchIn.length ? searchIn[endIdx] : ' ';
            final isWordBound = !RegExp(r'[a-zA-Z]').hasMatch(charBefore) &&
                                !RegExp(r'[a-zA-Z]').hasMatch(charAfter);

            if (isWordBound) {
              scores[category] = (scores[category] ?? 0) + 1.5;
              triggers.add(EmotionTrigger(
                word: w,
                category: category,
                startIndex: idx,
                endIndex: endIdx,
                weight: 1.5,
              ));
            }
            searchFrom = endIdx;
          }
        }
      });
    }

    // ══════════════════════════════════════════════════════
    //  PHASE 1: Multi-word phrase matching (highest weight)
    // ══════════════════════════════════════════════════════


    _phrases.forEach((category, phraseList) {
      for (var phrase in phraseList) {
        int searchFrom = 0;
        while (true) {
          final idx = lowerText.indexOf(phrase, searchFrom);
          if (idx == -1) break;
          scores[category] = (scores[category] ?? 0) + 2.0; // Phrases are worth 2x
          triggers.add(EmotionTrigger(
            word: journalText.substring(idx, min(idx + phrase.length, journalText.length)).trim(),
            category: category,
            startIndex: idx,
            endIndex: min(idx + phrase.length, journalText.length),
            weight: 2.0,
          ));
          searchFrom = idx + phrase.length;
        }
      }
    });

    // ══════════════════════════════════════════════════
    //  PHASE 2: Single-word lexicon with negation check
    // ══════════════════════════════════════════════════
    _lexicon.forEach((category, wordList) {
      for (var w in wordList) {
        int searchFrom = 0;
        while (true) {
          final idx = lowerText.indexOf(w, searchFrom);
          if (idx == -1) break;

          // Check for negation: look backwards up to 4 words
          final bool isNegated = _isNegated(lowerText, idx);

          // Check for intensity amplifiers nearby
          final double multiplier = _getIntensityMultiplier(lowerText, idx);

          if (isNegated) {
            // Negated: flip the emotion (e.g., "not happy" → subtract from joy, add to sadness)
            scores[category] = (scores[category] ?? 0) - 0.5;
            final opposite = _getOppositeCategory(category);
            scores[opposite] = (scores[opposite] ?? 0) + 0.7;
            triggers.add(EmotionTrigger(
              word: _extractContextWindow(journalText, idx, w.length),
              category: category,
              startIndex: idx,
              endIndex: min(idx + w.length, journalText.length),
              weight: -0.5,
              negated: true,
            ));
          } else {
            final score = 1.0 * multiplier;
            scores[category] = (scores[category] ?? 0) + score;
            triggers.add(EmotionTrigger(
              word: _extractContextWindow(journalText, idx, w.length),
              category: category,
              startIndex: idx,
              endIndex: min(idx + w.length + 2, journalText.length),
              weight: score,
            ));
          }
          searchFrom = idx + w.length;
        }
      }
    });

    // ══════════════════════════════════════════════════
    //  PHASE 2.3: Contrastive Conjunction Reweighting
    //  When "but", "however", "lekin", "magar" etc. appear,
    //  the user's CURRENT state (post-conjunction) outweighs
    //  PAST state (pre-conjunction). Dampen pre-but triggers
    //  by 0.4x, boost post-but triggers by 1.6x.
    //  Fixes: "happy yesterday but not happy today" → Sadness
    // ══════════════════════════════════════════════════
    {
      const contrastiveWords = [
        'but', 'however', 'although', 'though', 'yet',
        'lekin', 'magar', 'par', 'phir bhi',
      ];

      // Find the LAST contrastive conjunction (most recent contrast wins)
      int contrastIdx = -1;
      for (var cw in contrastiveWords) {
        final idx = lowerText.lastIndexOf(' $cw ');
        if (idx > contrastIdx) contrastIdx = idx;
      }

      if (contrastIdx > 0) {
        // Apply adjustments to existing scores based on trigger positions
        // Pre-conjunction triggers: subtract 60% of their weight (dampen past state)
        // Post-conjunction triggers: add 60% of absolute weight (boost current state)
        for (var trigger in triggers) {
          if (trigger.startIndex < contrastIdx) {
            // Dampen pre-conjunction (past state) — remove 60% of contribution
            scores[trigger.category] = (scores[trigger.category] ?? 0) - trigger.weight * 0.6;
          } else {
            // Boost post-conjunction (current state) — add 60% extra contribution
            final boostWeight = trigger.weight.abs() * 0.6;
            if (trigger.negated) {
              // If negated, boost the opposite category's score
              final opp = _getOppositeCategory(trigger.category);
              scores[opp] = (scores[opp] ?? 0) + boostWeight;
            } else {
              scores[trigger.category] = (scores[trigger.category] ?? 0) + boostWeight;
            }
          }
        }
      }
    }

    // ══════════════════════════════════════════════════
    //  PHASE 2.5: Adaptive Learning — Apply user corrections
    //  Activation threshold: ≥5 corrections (prevents noise/misclicks)
    //  Weights decay 20% per month without reinforcement
    // ══════════════════════════════════════════════════
    bool adaptiveActive = false;
    if (wordOverrides != null && wordOverrides.isNotEmpty) {
      for (var trigger in triggers) {
        final wordKey = trigger.word.toLowerCase().trim();
        // Check each word fragment against the override map
        for (var overrideKey in wordOverrides.keys) {
          if (wordKey.contains(overrideKey)) {
            final corrections = wordOverrides[overrideKey] as Map<String, dynamic>?;
            if (corrections != null) {
              corrections.forEach((emotionLabel, count) {
                if (count is int && count >= 5) {
                  // This word has been corrected to this emotion ≥5 times
                  final category = _emotionToCategory(emotionLabel);
                  scores[category] = (scores[category] ?? 0) + 2.5;
                  adaptiveActive = true;
                }
              });
            }
          }
        }
      }
    }

    // ══════════════════════════════════════════════════
    //  PHASE 3: Health context adjustments
    // ══════════════════════════════════════════════════
    if (sleepHours < 6) {
      scores['fatigue'] = (scores['fatigue'] ?? 0) + 3.0;
      scores['fear'] = (scores['fear'] ?? 0) + 1.0;
      scores['sadness'] = (scores['sadness'] ?? 0) + 1.0;
      if (predefinedBucket == null && (scores['fatigue'] ?? 0) > 4) {
        predefinedBucket = 'Fatigue';
      }
    }

    // Floor negative scores to 0
    scores.forEach((key, value) { if (value < 0) scores[key] = 0; });

    // ══════════════════════════════════════════════════
    //  PHASE 4: Determine primary emotion
    // ══════════════════════════════════════════════════
    String primaryEmotion = predefinedBucket ?? 'Contemplation';
    double maxScore = 0;
    double totalHits = scores.values.fold(0.0, (a, b) => a + b);

    if (predefinedBucket == null) {
      scores.forEach((key, value) {
        if (value > maxScore) {
          maxScore = value;
          primaryEmotion = _categoryToEmotion(key);
        }
      });
    } else {
      maxScore = scores.values.fold(0.0, (a, b) => a > b ? a : b);
    }

    // ══════════════════════════════════════════════════
    //  PHASE 5: Compute confidence
    // ══════════════════════════════════════════════════
    double confidence = 0.45;
    if (predefinedBucket != null) {
      confidence = 0.92;
    } else if (totalHits > 0 && maxScore > 0) {
      // Higher separation between top and runner-up → higher confidence
      final sorted = scores.values.toList()..sort((a, b) => b.compareTo(a));
      final separation = sorted.length >= 2 ? (sorted[0] - sorted[1]) / max(1, sorted[0]) : 0.8;
      confidence = min(0.95, 0.40 + separation * 0.35 + min(0.20, maxScore * 0.04));
    }

    // ══════════════════════════════════════════════════
    //  PHASE 6: Fallback for zero signal
    // ══════════════════════════════════════════════════
    if (maxScore <= 0 && predefinedBucket == null) {
      return EmotionResult(
        primaryEmotion: 'Introspection',
        intensityScore: 5,
        confidence: 0.35,
        reflectionPrompt: "You're clearly processing something internal. What would it look like to give yourself permission to sit with whatever is unfolding?",
        awarenessInsight: "Sometimes the most important feelings are the ones that resist being named. The act of writing is itself a form of clarity.",
        triggers: triggers.where((t) => !t.negated).toList(),
        scores: scores,
      );
    }

    // ══════════════════════════════════════════════════
    //  PHASE 7: Extract key phrases from user text for personalizing reflections
    // ══════════════════════════════════════════════════
    final keyPhrases = _extractKeyPhrases(journalText, triggers);
    final result = _generateInsights(primaryEmotion, scores, sleepHours, keyPhrases);

    return EmotionResult(
      primaryEmotion: primaryEmotion,
      intensityScore: result['score'] as int,
      confidence: confidence,
      method: adaptiveActive
          ? 'lexicon+rules+negation+adaptive${hasDevanagari ? "+hindi" : isHinglish ? "+hinglish" : ""}'
          : 'lexicon+rules+negation${hasDevanagari ? "+hindi" : isHinglish ? "+hinglish" : ""}',
      reflectionPrompt: result['prompt'] as String,
      awarenessInsight: result['insight'] as String,
      triggers: triggers.where((t) => !t.negated).toList(),
      scores: scores,
      vocabularyNote: result['vocabularyNote'] as String?,
    );
  }

  // ══════════════════════════════════════════════════════════
  //  NEGATION DETECTION — Clause-aware, word-boundary-safe (Change 12)
  //  Key fixes: wider 65-char window, word-boundary matching,
  //  all negators (including Hinglish) in single unified list
  // ══════════════════════════════════════════════════════════
  bool _isNegated(String text, int wordIdx) {
    final normalizedText = text
        .replaceAll('\u2018', "'")
        .replaceAll('\u2019', "'")
        .replaceAll('\u0060', "'");

    // Clause boundary pattern — includes Hinglish boundaries
    final clauseBoundaryPattern = RegExp(
      r'[,;.!?\u0964]'
      r'|\s+but\s+'
      r'|\s+however\s+'
      r'|\s+although\s+'
      r'|\s+yet\s+'
      r'|\s+while\s+'
      r'|\s+though\s+'
      r'|\s+still\s+'
      r'|\s+now\s+'
      r'|\s+today\s+'
      r'|\s+lekin\s+'
      r'|\s+magar\s+'
      r'|\s+par\s+'
      r'|\s+phir\s+bhi\s+',
      caseSensitive: false,
    );

    // Find most recent clause boundary before trigger word
    int clauseStart = 0;
    for (final match in clauseBoundaryPattern.allMatches(normalizedText)) {
      if (match.end <= wordIdx) clauseStart = match.end;
      else break;
    }

    // Extract clause window — max 65 chars lookback within clause
    // Wider than before to catch informal long-form negation
    final windowStart = max(clauseStart, wordIdx - 65);
    final clauseWindow = normalizedText
        .substring(windowStart, wordIdx)
        .toLowerCase()
        .trim();

    if (clauseWindow.isEmpty) return false;

    // Word-boundary negator matching
    // Prevents 'notable' matching 'not', 'nobody' matching 'no'
    for (var neg in _negators) {
      final negPattern = RegExp(
        r'(^|\s)' + RegExp.escape(neg) + r'(\s|$|[,\.!?])',
      );
      if (negPattern.hasMatch(clauseWindow)) return true;
    }

    return false;
  }

  /// Check if text contains Devanagari script (Hindi/Hinglish).
  /// Returns true if >20% of the text is non-ASCII (likely Hindi).
  static bool containsHindiText(String text) {
    if (text.isEmpty) return false;
    final devanagariChars = text.runes.where((r) => r >= 0x0900 && r <= 0x097F).length;
    return devanagariChars > (text.runes.length * 0.2);
  }

  /// Detect Hinglish (Hindi-English code-mixed) text by counting
  /// marker words. Returns true if 2+ Hinglish markers found. (Change 10)
  /// Threshold of 2 prevents false positives from single common words
  static bool _detectHinglish(String text) {
    const hinglishMarkers = [
      // Verb markers
      'hun', 'hoon', 'hai', 'hain', 'tha', 'thi', 'the',
      'raha', 'rahi', 'rahe', 'gaya', 'gayi', 'gaye',
      'karna', 'karta', 'karti', 'kar', 'karo', 'kiya',
      // Common Hinglish words
      'kya', 'nahi', 'nahin', 'nai', 'bahut', 'bohot', 'bahot',
      'acha', 'accha', 'aur', 'bhi', 'toh', 'to', 'yaar',
      'bhai', 'kal', 'aaj', 'zyada', 'thoda', 'bilkul',
      'ekdum', 'sahi', 'matlab', 'lag', 'laga',
      'mujhe', 'mera', 'meri', 'mere', 'hum', 'tum',
      'unhe', 'unka', 'unki', 'inhe', 'iska', 'iski',
      'please', 'yeh', 'woh', 'koi', 'kuch', 'sab',
      // Exam context markers common in Indian English
      'marks', 'result', 'rank', 'percentile', 'cutoff',
    ];
    int matches = 0;
    final lowerText = text.toLowerCase();
    for (var marker in hinglishMarkers) {
      // Word boundary check to avoid partial matches
      if (lowerText.contains(' $marker ') ||
          lowerText.contains(' $marker,') ||
          lowerText.contains(' $marker.') ||
          lowerText.endsWith(' $marker') ||
          lowerText.startsWith('$marker ')) {
        matches++;
        if (matches >= 2) return true; // Early exit
      }
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════
  //  INTENSITY MULTIPLIER
  // ══════════════════════════════════════════════════════════
  double _getIntensityMultiplier(String text, int wordIdx) {
    final windowStart = max(0, wordIdx - 20);
    final window = text.substring(windowStart, wordIdx).toLowerCase();

    for (var amp in _amplifiers) {
      if (window.contains(amp)) return 1.5;
    }
    for (var dim in _diminishers) {
      if (window.contains(dim)) return 0.5;
    }
    return 1.0;
  }

  // ══════════════════════════════════════════════════════════
  //  OPPOSITE CATEGORY (for negation flipping) (Change 14)
  //  Semantically correct: 'not angry' ≠ joy, it suggests relief/calm
  // ══════════════════════════════════════════════════════════
  String _getOppositeCategory(String category) {
    switch (category) {
      case 'joy':     return 'sadness';  // not happy → sad
      case 'sadness': return 'joy';      // not sad → joy
      case 'anger':   return 'sadness';  // not angry → relief/sadness
      case 'fear':    return 'fatigue';  // not anxious → calm/fatigue
      case 'fatigue': return 'joy';      // not tired → energized
      default:        return 'joy';
    }
  }

  // ══════════════════════════════════════════════════════════
  //  CONTEXT WINDOW EXTRACTION (show surrounding text)
  // ══════════════════════════════════════════════════════════
  String _extractContextWindow(String fullText, int idx, int wordLen) {
    final start = max(0, idx - 10);
    final end = min(fullText.length, idx + wordLen + 10);
    var snippet = fullText.substring(start, end).trim();
    if (start > 0) snippet = '...$snippet';
    if (end < fullText.length) snippet = '$snippet...';
    return snippet;
  }

  // ══════════════════════════════════════════════════════════
  //  KEY PHRASE EXTRACTION (for personalizing reflections)
  // ══════════════════════════════════════════════════════════
  List<String> _extractKeyPhrases(String text, List<EmotionTrigger> triggers) {
    final phrases = <String>[];
    // Get unique, non-negated trigger words, sorted by weight
    final sorted = triggers.where((t) => !t.negated && t.weight > 0).toList()
      ..sort((a, b) => b.weight.compareTo(a.weight));
    for (var t in sorted.take(3)) {
      if (!phrases.contains(t.word)) phrases.add(t.word);
    }
    return phrases;
  }

  String _categoryToEmotion(String category) {
    switch (category) {
      case 'joy': return 'Joy';
      case 'sadness': return 'Sadness';
      case 'anger': return 'Anger';
      case 'fear': return 'Apprehension';
      case 'fatigue': return 'Fatigue';
      default: return 'Contemplation';
    }
  }

  String _emotionToCategory(String emotion) {
    switch (emotion) {
      case 'Joy': return 'joy';
      case 'Sadness': return 'sadness';
      case 'Anger': return 'anger';
      case 'Apprehension': return 'fear';
      case 'Fatigue': return 'fatigue';
      default: return 'joy';
    }
  }

  // ══════════════════════════════════════════════════════════
  //  CONTEXT-AWARE INSIGHT GENERATION
  //  Now references the user's actual words in generated text
  // ══════════════════════════════════════════════════════════
  Map<String, dynamic> _generateInsights(String primaryEmotion, Map<String, double> scores, int sleepHours, List<String> keyPhrases) {
    int finalScore = 5;
    String prompt = '';
    String insight = '';
    String? vocabularyNote;
    final random = Random();

    // Build a contextual fragment from their actual words
    final userContext = keyPhrases.isNotEmpty
        ? 'You wrote about "${keyPhrases.first}"'
        : 'Your reflection';

    switch (primaryEmotion) {
      case 'Joy':
        finalScore = min(10, 7 + min(3, (scores['joy'] ?? 0).round()));
        final prompts = [
          "$userContext sounds like it carries real warmth. What specifically made that moment stand out for you?",
          "There's something genuinely bright here. What conditions helped this positive feeling emerge?",
          "$userContext — that's worth pausing on. How might you create space for more of this in your week?",
        ];
        final insights = [
          "Your words carry a lightness that suggests genuine contentment. Anchoring these moments helps you build a personal inventory of what actually works for your wellbeing.",
          "The positive energy in your reflection isn't superficial — it reflects a real shift. Noticing what sparks this helps you recognize your own patterns.",
          "Joy often hides in specific details. The fact that you noticed and wrote about it means you're already building the muscle of positive awareness.",
        ];
        prompt = prompts[random.nextInt(prompts.length)];
        insight = insights[random.nextInt(insights.length)];
        vocabularyNote = 'Joy is more than happiness — it often signals alignment between what you value and what you are experiencing. Noticing it helps you replicate the conditions.';
        break;

      case 'Anger':
        finalScore = max(1, 3 - min(2, (scores['anger'] ?? 0).round()));
        final prompts = [
          "$userContext — that frustration has real energy behind it. Some people find anger points to things they deeply value. Would you like to explore what boundary this feeling might be protecting?",
          "The intensity in your words is striking. What would it look like to channel this energy into one concrete action today?",
          "$userContext is clearly weighing on you. If this anger could speak, what would it ask for?",
        ];
        final insights = [
          "Frustration this strong is rarely about the surface event. It often signals a boundary that's being crossed or a value that's being ignored.",
          "The heat in your words suggests something important is at stake. Anger, when examined without judgment, can be a surprisingly useful compass.",
          "Your reaction carries real conviction. That conviction — separate from the frustration — might be telling you something worth listening to.",
        ];
        prompt = prompts[random.nextInt(prompts.length)];
        insight = insights[random.nextInt(insights.length)];
        if (sleepHours < 6) {
          insight = "With only $sleepHours hours of sleep, your emotional threshold is significantly lower. The frustration you're experiencing is being amplified by physiological exhaustion — be gentle with yourself today.";
        }
        vocabularyNote = 'Anger frequently guards a boundary or a value being crossed. Beneath most anger, there is something that mattered.';
        break;

      case 'Sadness':
        finalScore = max(2, 5 - min(3, (scores['sadness'] ?? 0).round()));
        final prompts = [
          "$userContext — there's real tenderness here. What does this feeling need from you right now?",
          "Your words carry a weight that suggests something meaningful beneath the surface. What part of this would feel good to name out loud?",
          "$userContext resonates with something deep. If you could send a message to yourself yesterday, what would you say?",
        ];
        final insights = [
          "The vulnerability in your reflection takes courage. Sadness often signals that something mattered deeply — your willingness to sit with it shows real self-awareness.",
          "Heavy feelings like these are your psyche processing something important. The fact that you're writing about it rather than pushing it away is significant.",
          "Grief and heaviness don't follow a schedule. What you're feeling right now is a valid response to something that mattered to you.",
        ];
        prompt = prompts[random.nextInt(prompts.length)];
        insight = insights[random.nextInt(insights.length)];
        vocabularyNote = 'Sadness often signals that something mattered deeply to you. It is the emotional cost of caring.';
        break;

      case 'Apprehension':
        finalScore = max(2, 4 - min(2, (scores['fear'] ?? 0).round()));
        final prompts = [
          "$userContext — the anxiety in your words is palpable. What's one thing you can completely release control of today?",
          "Your mind seems to be running multiple scenarios at once. What would feel different if you allowed just this moment to be enough?",
          "$userContext sounds like it's creating real pressure. What's the smallest possible next step you could take?",
        ];
        final insights = [
          "The tension you're describing is your nervous system scanning for threats. Noticing this pattern is itself a powerful form of regulation.",
          "Anxiety often disguises itself as productivity or vigilance. The racing quality in your thoughts suggests your system is in protective mode.",
          "The pressure you're feeling is real, but your body's alarm system may be amplifying it beyond what the situation warrants. Recognition is the first step to recalibration.",
        ];
        prompt = prompts[random.nextInt(prompts.length)];
        insight = insights[random.nextInt(insights.length)];
        if (sleepHours < 6) {
          insight = "With only $sleepHours hours of sleep, your nervous system is running on high alert. The anxiety you feel has a significant physiological component — your amygdala is literally more reactive when sleep-deprived.";
        }
        vocabularyNote = 'Apprehension often shows up as a tightening in the chest or a racing mind before uncertain situations — your body scanning for threats.';
        break;

      case 'Fatigue':
        finalScore = 4;
        if (sleepHours < 6) {
          final prompts = [
            "Your tracker shows only $sleepHours hours of rest. How is that physical exhaustion showing up in your emotional world today?",
            "Running on $sleepHours hours is unsustainable. Would you like to try a micro-experiment: what's one thing you could skip tonight to reclaim 30 minutes of rest?",
          ];
          final insights = [
            "Your body is sending a clear signal with only $sleepHours hours of sleep. This level of fatigue doesn't just affect energy — it fundamentally alters how you process emotions, make decisions, and relate to others.",
            "Chronic under-rest creates a debt that compounds. The heaviness you're feeling isn't weakness — it's your system demanding the maintenance it needs to function.",
          ];
          prompt = prompts[random.nextInt(prompts.length)];
          insight = insights[random.nextInt(insights.length)];
        } else {
          final prompts = [
            "$userContext — your body might be asking for something beyond physical rest. When was the last time you rested without guilt?",
            "Even with adequate sleep, emotional exhaustion is real. What would true rest look like for you today?",
          ];
          final insights = [
            "Fatigue isn't always about sleep hours — emotional labor, hypervigilance, and sustained stress all drain the same battery. Your system is asking for recalibration.",
            "The exhaustion you're describing has a quality that goes beyond tiredness. Sometimes the bravest thing you can do is admit you need to stop.",
          ];
          prompt = prompts[random.nextInt(prompts.length)];
          insight = insights[random.nextInt(insights.length)];
        }
        vocabularyNote = 'Fatigue is not just physical tiredness. Emotional labor, decision fatigue, and sustained stress all drain the same inner battery.';
        break;

      default:
        finalScore = 5;
        prompt = "$userContext suggests you're in a reflective space. What would it look like to give yourself permission to just feel whatever is here?";
        insight = "Sometimes the most important feelings resist clean labels. The fact that you sat down to write is itself a meaningful act of self-awareness.";
    }

    return {'score': finalScore, 'prompt': prompt, 'insight': insight, 'vocabularyNote': vocabularyNote};
  }

  // ══════════════════════════════════════════════════════════
  //  SUPPORTIVE LENS (REMIX) — Context-aware, never generic
  // ══════════════════════════════════════════════════════════
  String generateRemix(String journalText, {String? selectedEmotion, Map<String, dynamic>? healthData}) {
    final lowerText = journalText.toLowerCase();
    final random = Random();

    int sleepHours = 8;
    if (healthData != null && healthData.containsKey('sleep_duration_hours')) {
      sleepHours = (healthData['sleep_duration_hours'] as num?)?.toInt() ?? 8;
    }

    // Run the full analysis to determine emotion + extract key phrases
    final analysis = analyzeEntry(journalText, selectedEmotion: selectedEmotion, healthData: healthData);
    final keyPhrases = _extractKeyPhrases(journalText, analysis.triggers);
    final userRef = keyPhrases.isNotEmpty ? 'When you wrote about "${keyPhrases.first}", ' : '';

    String? predefinedMode;
    if (selectedEmotion != null) {
      final e = selectedEmotion.toLowerCase();
      if (['joy', 'optimistic', 'peaceful'].contains(e)) predefinedMode = 'Joy';
      else if (['sadness'].contains(e)) predefinedMode = 'Sadness';
      else if (['anger', 'disgust'].contains(e)) predefinedMode = 'Anger';
      else if (['fear', 'anxious', 'insecure', 'overwhelmed', 'worried', 'dread'].contains(e)) predefinedMode = 'Apprehension';
      else if (['fatigue'].contains(e)) predefinedMode = 'Fatigue';
    }

    final primaryMode = predefinedMode ?? analysis.primaryEmotion;

    final contextualPrefix = (predefinedMode != null && selectedEmotion != null)
        ? "I notice you tagged this as \"$selectedEmotion.\" "
        : "";

    switch (primaryMode) {
      case 'Apprehension':
        final responses = [
          "$contextualPrefix[Perspective] ${userRef}it revealed real pressure you're carrying. But pressure and capacity are two different things. Sometimes acknowledging \"this is hard\" is more powerful than trying to push through. You're allowed to pause.",
          "$contextualPrefix[Clarity] ${userRef}the anxiety beneath those words is visible. Your nervous system is doing its job — scanning for threats. But not every signal is a real emergency. What would it feel like to let just one worry go tonight?",
          "$contextualPrefix[Growth] ${userRef}it sounds like your mind is overloaded. Would you like to try a 3-minute experiment? Write down the three things worrying you most, then circle the one you can actually influence today. Just one.",
        ];
        if (sleepHours < 6) return "$contextualPrefix[Perspective] ${userRef}the dread you're carrying makes even more sense on $sleepHours hours of sleep. Sleep deprivation amplifies anxiety by up to 30%. You're not falling apart — you're exhausted. That's different.";
        return responses[random.nextInt(responses.length)];

      case 'Sadness':
        final responses = [
          "$contextualPrefix[Clarity] ${userRef}what you're feeling sounds like genuine grief. That's a sign of depth, not weakness. Having a tough chapter is just that — a chapter, not your entire story.",
          "$contextualPrefix[Perspective] ${userRef}the weight in your words is real. But consider: the people who feel most deeply are also the ones who love most deeply. This heaviness isn't a flaw — it's the cost of caring.",
          "$contextualPrefix[Growth] ${userRef}there's real tenderness here. Would you like to try something? Write one sentence starting with \"What I actually need right now is...\" — sometimes naming the need is the first step toward meeting it.",
        ];
        return responses[random.nextInt(responses.length)];

      case 'Joy':
        final responses = [
          "$contextualPrefix[Growth] ${userRef}this is a beautiful moment to anchor. You might try writing down one specific sensory detail about what made this good — the sound, the light, someone's expression. Revisiting details like these becomes a wellbeing tool over time.",
          "$contextualPrefix[Perspective] ${userRef}your energy here is contagious even on paper. This isn't just a \"good day\" — it's evidence of what's possible when things align. How might you create more conditions like these?",
          "$contextualPrefix[Clarity] ${userRef}the warmth here is genuine. Positive moments are neurologically sticky when we pay attention to them. You're literally rewiring your brain's default narrative by writing this down.",
        ];
        return responses[random.nextInt(responses.length)];

      case 'Anger':
        final responses = [
          "$contextualPrefix[Perspective] ${userRef}your frustration makes complete sense. Instead of judging the anger, you might try asking: what boundary is this feeling trying to protect? Anger often guards our most important values.",
          "$contextualPrefix[Clarity] ${userRef}the intensity here is striking. Your anger isn't irrational — it's information. Something important is being threatened or crossed. The question isn't whether the anger is valid (it is), but what it's pointing toward.",
          "$contextualPrefix[Growth] ${userRef}this energy needs somewhere constructive to go. Would you like to try writing a \"letter you'll never send\" — say everything you need to say, uncensored, then close the page? Sometimes the release is the medicine.",
        ];
        if (sleepHours < 6) return "$contextualPrefix[Perspective] ${userRef}with only $sleepHours hours of sleep, your frustration threshold is fundamentally different. Sleep debt makes our emotional skin thinner. Would you like to try not judging the anger today and revisit this feeling tomorrow with fresh eyes?";
        return responses[random.nextInt(responses.length)];

      case 'Fatigue':
        final responses = [
          "$contextualPrefix[Growth] ${userRef}when energy is this low, even micro-actions count. Would you like a small experiment — one glass of water, five minutes of eyes-closed silence, or moving your bedtime up by 20 minutes tonight?",
          "$contextualPrefix[Perspective] ${userRef}the exhaustion you're describing isn't laziness — it's your system's emergency brake. Sometimes the most productive thing you can do is absolutely nothing. Permission granted.",
          "$contextualPrefix[Clarity] ${userRef}fatigue at this level isn't just physical. Emotional exhaustion, decision fatigue, and social depletion all draw from the same well. What would it look like to protect your energy for the next 24 hours?",
        ];
        return responses[random.nextInt(responses.length)];
    }

    // Fallback with context
    return "$contextualPrefix[Clarity] ${userRef}your reflection carries nuance that resists easy labels. The fact that you're putting words to your inner experience — even imperfect ones — is itself a meaningful act. Keep noticing.";
  }

  /// Generate weekly summary. 100% on-device.
  /// [slope]: +1 = improving, 0 = stable, -1 = declining (from getWeeklyEmotionSlope)
  String generateWeeklySummary(List<String> last7DaysEntries, {int slope = 0}) {
    if (last7DaysEntries.isEmpty) return "Not enough reflections this week to generate a summary. Keep writing!";

    final combined = last7DaysEntries.join(" ").toLowerCase();
    final entryCount = last7DaysEntries.length;

    // Score each category across all entries
    Map<String, double> weekScores = {'joy': 0, 'sadness': 0, 'anger': 0, 'fear': 0, 'fatigue': 0};
    _lexicon.forEach((category, words) {
      for (var w in words) {
        weekScores[category] = (weekScores[category] ?? 0) + RegExp(w).allMatches(combined).length;
      }
    });

    final sorted = weekScores.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final dominant = sorted[0].key;
    final secondary = sorted.length >= 2 && sorted[1].value > 0 ? sorted[1].key : null;

    final dominantLabel = _categoryToEmotion(dominant);
    final secondaryLabel = secondary != null ? _categoryToEmotion(secondary) : null;

    if (sorted[0].value == 0) {
      return "Your $entryCount reflections this week were contemplative and measured. No single emotional thread dominated \u2014 a sign of balanced introspection.";
    }

    String summary = "Across $entryCount entries this week, the dominant emotional thread was **$dominantLabel**";
    if (secondaryLabel != null && secondaryLabel != dominantLabel) {
      summary += ", with undercurrents of **$secondaryLabel**";
    }
    summary += ". ";

    switch (dominant) {
      case 'joy':
        summary += "There was a notable presence of positivity and warmth. These entries can serve as anchors when harder weeks come.";
        break;
      case 'sadness':
        summary += "A recurring theme of heaviness appeared across your entries. Consider whether there's a specific trigger you'd like to explore further.";
        break;
      case 'anger':
        summary += "Frustration surfaced repeatedly. There may be a boundary or value that needs attention.";
        break;
      case 'fear':
        summary += "Anxiety and pressure were recurring themes. Grounding practices and boundary-setting could be particularly helpful right now.";
        break;
      case 'fatigue':
        summary += "Exhaustion was a consistent signal. Your system is asking for rest \u2014 this is worth taking seriously.";
        break;
    }

    // Directional language from emotion slope
    if (slope > 0) {
      summary += "\n\n\u{1F4C8} **Direction: Improving** \u2014 Your emotional tone has been trending more positive over the past week. Whatever you have been doing seems to be helping.";
    } else if (slope < 0) {
      summary += "\n\n\u{1F4C9} **Direction: Declining** \u2014 Your emotional tone has been trending heavier this week. This is not a failure \u2014 it is information. Consider what might be contributing.";
    } else {
      summary += "\n\n\u27A1\uFE0F **Direction: Stable** \u2014 Your emotional landscape has been relatively consistent this week.";
    }

    return summary;
  }

  /// Validates the engine against externally-labeled entries. (Change 15)
  /// Pass entries from ISEAR or any labeled dataset.
  /// Returns accuracy as a value between 0.0 and 1.0.
  /// Use this to generate an honest, externally-validated accuracy metric.
  ///
  /// ISEAR label mapping:
  ///   joy → Joy
  ///   fear → Apprehension
  ///   anger → Anger
  ///   sadness → Sadness
  ///   disgust → Anger
  ///   shame → Sadness
  ///   guilt → Sadness
  double validateAgainstDataset(List<Map<String, String>> labeledEntries) {
    // labeledEntries format: [{'text': '...', 'label': 'Joy'}, ...]
    if (labeledEntries.isEmpty) return 0.0;
    int correct = 0;
    for (var entry in labeledEntries) {
      final text = entry['text'] ?? '';
      final trueLabel = entry['label'] ?? '';
      if (text.isEmpty || trueLabel.isEmpty) continue;
      final result = analyzeEntry(text);
      if (result.primaryEmotion == trueLabel) correct++;
    }
    return correct / labeledEntries.length;
  }
}
