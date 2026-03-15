# Architecture — MannMitra

## Data Flow Diagram

```
┌──────────────────────────────┐
│       User Interface         │
│       (Flutter/Dart)         │
│                              │
│  Journal Screen              │
│  Dashboard Screen            │
│  Insights Screen             │
│  Settings Screen             │
│  Onboarding Consent          │
│                              │
│  Lang:English/Hindi/Hinglish │
│                              |
└────────────┬─────────────────┘
             │
             v
┌──────────────────────────────┐
│   NLP Emotion Detector       │
│   (100% On-Device)           │
│                              │
│   Method: lexicon+rules      │
│          +negation+adaptive  │
│          +multilingual       │
│                              │
│   Pipeline:                  │
│   0.  Multilingual phrases   │
│       (Hinglish/Hindi, 2.5x) │
│   0.5 Multilingual lexicon   │
│       (~180 words, 1.5x)     │
│   1.  Phrase matching (2x)   │
│   2.  Single-word lexicon    │
│   2.3 Contrastive conjunct.  │
│       (but/lekin reweight)   │
│   2.5 Adaptive learning      │
│       (≥5 thresh, 20% decay) │
│   3.  Health context         │
│   4.  Clause-aware negation  │
│       (65-char lookback)     │
│   5.  Intensity modifiers    │
│   6.  Ground truth override  │
│                              │
│   Output: EmotionResult      │
│   ├── primary_emotion        │
│   ├── confidence (0-1)       │
│   ├── triggers (with context)│
│   ├── intensity (1-10)       │
│   └── method label           │
└────────────┬─────────────────┘
             │
             v
┌──────────────────────────────┐
│   Adaptive Learning Layer    │
│                              │
│   - User corrections (👍/👎)│
│   - Word overrides map       │
│   - Temporal emotion patterns│
│   - Reflection feedback      │
│                              │
│   Stored in: Hive settings   │
│   Activation: ≥2 corrections │
│   Decay: 20%/month           │
│   Weight bonus: +2.5         │
└────────────┬─────────────────┘
             │
             v
┌──────────────────────────────┐
│   Local Storage              │
│   (Hive DB — AES-256)        │
│                              │
│   - Journal entries          │
│   - Emotion tags             │
│   - Context tags             │
│   - Settings/Consent         │
│   - User corrections         │
│   - Word override map        │
│   - Temporal patterns        │
│   - Reflection feedback      │
│                              │
│   Encryption key stored in:  │
│   Android KeyStore /         │
│   iOS Keychain               │
│                              │
│          │
└──────────────────────────────┘
```

## Key Components

| Component | File | Purpose |
|---|---|---|
| Emotion Detector | `lib/services/llm_service.dart` | On-device NLP engine with negation, phrases, intensity, adaptive learning |
| Local Storage | `lib/services/local_storage_service.dart` | Hive DB for entries, settings, consent, and adaptive learning data |
| Encryption Service | `lib/services/encryption_service.dart` | AES-256 key generation and secure storage via platform keychain |
| Health Service | `lib/services/health_service.dart` | Sleep/Steps data (mock on web) |
| Locale Provider | `lib/l10n/locale_provider.dart` | English/Hindi locale management |
| Hindi Strings | `lib/l10n/hi_strings.dart` | ~100 Hindi translated UI strings |
| English Strings | `lib/l10n/en_strings.dart` | ~100 English UI strings |

## NLP Pipeline Detail

| Phase | Name | Weight | Description |
|---|---|---|---|
| 0 | Multilingual Phrases | 2.5x | Scans ~100 Hinglish + ~39 Hindi Devanagari phrases |
| 0.5 | Multilingual Lexicon | 1.5x | Scans ~120 Hinglish + ~60 Hindi single words with word-boundary checks |
| 1 | Phrase Matching | 2.0x | Scans ~120 English multi-word phrases (e.g., "feel alone", "bad marks") |
| 2 | Single-Word Lexicon | 1.0x | Scans ~200 English single-word triggers with substring matching |
| 2.3 | Contrastive Reweighting | ±60% | Dampens pre-conjunction (but/lekin) triggers by 60%, boosts post-conjunction by 60% |
| 2.5 | Adaptive Learning | +2.5 | Applies user correction overrides (≥5 corrections per word, 20% monthly decay) |
| 3 | Health Context | +3.0 | Boosts fatigue/fear/sadness when sleep < 6 hours |
| 4 | Ground Truth Override | 0.92 | If user selected an emotion tag, overrides NLP with high confidence |
| 5 | Negation Detection | -0.5/+0.7 | 65-char lookback for negators within clause boundaries; flips to opposite |
| 6 | Intensity Modifiers | 1.5x/0.5x | Amplifiers ("very", "bahut") boost 1.5x; diminishers ("thoda") reduce 0.5x |

## Third-Party Libraries

| Library | Purpose | Data Sent Externally? |
|---|---|---|
| `hive_flutter` | Local encrypted database | ❌ No |
| `flutter_secure_storage` | AES-256 encryption key storage | ❌ No (platform keychain) |
| `fl_chart` | Graph visualizations | ❌ No |
| `speech_to_text` | Voice input (platform STT) | ⚠️ Audio processed by OS |
| `flutter_animate` | UI animations | ❌ No |
| `flutter_riverpod` | State management | ❌ No |
| `flutter_localizations` | Hindi/English localization | ❌ No |
| `firebase_core` | Firebase init (fallback) | ❌ No data sent |

## Security Measures
- Default: Local-only storage. No cloud sync.
- AES-256 encryption for Hive boxes (key in platform secure enclave).
- No external API calls for NLP inference.
- No logging of raw journal text to console.
- Consent required before any data processing.
- One-click data deletion available in Settings (including learned vocabulary and encryption key).
- Apostrophe normalization prevents unicode bypass in negation detection.
