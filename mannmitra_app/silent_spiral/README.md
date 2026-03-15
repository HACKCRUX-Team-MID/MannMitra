# MannMitra 🌀

A privacy-first mental health reflection app built with Flutter. Combines guided journaling with **adaptive on-device emotion detection** to help users observe their emotional patterns — without clinical diagnosis.

> 🛡️ **This app is a reflection tool — not a clinical diagnostic application.**

## Features

### Core
- **Guided Journaling** with voice-to-text and emotion lexicon selection
- **On-Device NLP Emotion Detection** (`Method: lexicon+rules+negation+adaptive+multilingual`, `Confidence: human-readable labels`)
- **Multilingual Support**: Hinglish (~100 phrases + ~120 single words) and Hindi Devanagari (~39 phrases + ~60 single words) detected and scored at 2.5x/1.5x weight
- **Clause-Aware Negation Detection**: "I am NOT happy" correctly flips from Joy → Sadness (65-char lookback, clause boundaries, Hinglish negators)
- **Contrastive Conjunction Handling**: "happy yesterday BUT not happy today" correctly detects current state (Sadness) over past state (Joy) via Phase 2.3 reweighting
- **Multi-Word Phrase Matching**: ~120 phrases like "feel alone", "can't sleep" scored at 2x weight
- **Intensity Modifiers**: "very sad" (1.5x) vs "slightly worried" (0.5x)
- **Explainable AI**: "Why this?" toggle shows exact trigger words with context windows
- **Context Tags**: Tag entries with #Work, #Exams, #Family, etc. + custom tags
- **Supportive Lens**: Personalized reframing that quotes your actual words
- **Vocabulary Builder**: Expandable chip teaching emotional literacy per detected emotion
- **Context-Aware Prompts**: Pre-journaling prompts adapt to time of day, yesterday's emotion, and journaling gaps

### Adaptive Learning (On-Device ML)
- **Thumbs Up/Down Feedback**: Rate every emotion detection result
- **Personal Vocabulary Learning**: Corrections stored as `{word → emotion}` overrides
- **Automatic Adaptation**: After **≥5 corrections per word**, the model adjusts scores (+2.5 weight bonus)
- **Monthly Decay**: Learned weights decay **20% per month** without reinforcement (prevents stale overrides)
- **Undo / Reset**: View learned words in Settings, remove individual words or reset all learning
- **Temporal Pattern Tracking**: Emotion frequency by day-of-week and time-of-day
- **Dynamic Method Label**: Shows `+adaptive` when learned corrections are active
- **Learning Stats**: Settings screen shows corrections logged, learned words, activation status

### Privacy & Ethics
- **Local-Only Storage** (default): Data never leaves the device
- **AES-256 Encryption**: Journal data encrypted with keys stored in platform secure enclave (Android KeyStore / iOS Keychain)
- **Mandatory Consent**: First-launch onboarding requiring explicit agreement
- **Delete All Data**: Type **DELETE** to confirm permanent deletion (including learned vocabulary & encryption keys)
- **Crisis Resources**: Indian and international helpline numbers always accessible
- **No External APIs**: Emotion detection runs 100% on-device in Dart
- **Cloud Sync Disabled**: Firestore sync is a no-op stub by default
- **Voice Consent Modal**: Privacy dialog shown before first microphone use
- **Web Passphrase**: PBKDF2 key derivation from user-provided passphrase on web
- **Confidence Labels**: Human-readable labels ("We're fairly sure" / "This might be" / "We could be wrong")
- **AI Disclaimers**: Every insight marked as "🤖 AI-generated · rules-based engine · may be imperfect"
- **Multilingual Badge**: When Hinglish/Hindi detected, shows which lexicon was used

### Analytics & Insights
- **30-Day Mood Heatmap** with intensity visualization
- **Weekly AI Summary** with directional language (📈 Improving / ➡️ Stable / 📉 Declining)
- **Weekly Direction Indicator** on dashboard with streak counter
- **Temporal Pattern Insights**: "You tend to feel Sadness on Mondays in the evening"
- **Spiral Risk Detection**: 9-signal behavioral engine (sleep, mobility, HR, consecutive negatives, word count, late-night journaling, silence gaps, contemplation cluster, vibe decline) with gentle alerts and crisis resources
- **7 Pattern Types**: High stress, fatigue, joy reinforcement, emotional whiplash, academic pressure, emotional numbness, late-night journaling
- **Bar/Line Charts** for Steps, Sleep, and Reflections (last 7 days)
- **Context Tag Usage Graph** tracking most frequent tags
- **Streak Tracking** for journaling consistency
- **CSV Export** for full data ownership

### Localization & Accessibility
- **Hindi Localization**: Full Hindi translation (~100 strings) with language toggle in Settings
- **English/Hindi Toggle**: Instant switch via Settings → Language / भाषा
- **Screen Reader Support**: Semantics labels on all interactive elements
- **High Contrast Dark Theme**: Earthy palette (Sage Green, Terracotta, Deep Ocean Blue)

### UX
- **Glassmorphic UI** with animated background orbs
- **Breathing Grounding Halo** before intense journaling
- **Micro Check-In** quick mood slider on Dashboard
- **Quick Vibe Check**: Daily mood capture

## Architecture
See [ARCHITECTURE.md](ARCHITECTURE.md) for data flow diagrams and component tables.

```
User → Journal Entry → On-Device NLP Engine (lexicon+rules+negation)
                              │
                              ├── Phase 0:   Multilingual phrase matching (2.5x — Hinglish/Hindi)
                              ├── Phase 0.5: Multilingual single-word lexicon (1.5x — ~180 words)
                              ├── Phase 1:   Multi-word phrase matching (2x — ~120 English phrases)
                              ├── Phase 2:   Single-word lexicon scan (1x — ~200 English words)
                              ├── Phase 2.3: Contrastive conjunction reweighting (but/lekin/magar)
                              ├── Phase 2.5: Adaptive learning (user corrections, ≥5 threshold)
                              ├── Phase 3:   Health context (sleep < 6h → fatigue boost)
                              ├── Phase 4:   Ground truth override (UI emotion selection)
                              ├── Phase 5:   Clause-aware negation detection (65-char lookback)
                              └── Phase 6:   Intensity modifiers (amplifiers/diminishers)
                                    │
                                    v
                              EmotionResult
                              ├── primary_emotion
                              ├── confidence (0-1)
                              ├── triggers (word spans + context)
                              ├── intensity (1-10)
                              └── method (lexicon+rules+negation[+adaptive][+hinglish/+hindi])
                                    │
                                    v
                              Hive Local DB (AES-256 encrypted)
```

## NLP Evaluation

| Emotion | Precision | Recall | F1 |
|---|---|---|---|
| Joy | 1.00 | 0.80 | 0.89 |
| Sadness | 1.00 | 1.00 | 1.00 |
| Anger | 1.00 | 1.00 | 1.00 |
| Apprehension | 0.83 | 1.00 | 0.91 |
| Fatigue | 1.00 | 1.00 | 1.00 |
| **Overall Accuracy** | | | **96%** |

See [EVALUATION.md](EVALUATION.md) for full methodology and error analysis (300-entry dataset).

## Project Documentation
| Document | Description |
|---|---|
| [PRIVACY.md](PRIVACY.md) | Data collection, storage, encryption, user rights, crisis resources |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Data flow, NLP pipeline, components, third-party audit |
| [EVALUATION.md](EVALUATION.md) | NLP accuracy metrics, 300-entry eval dataset, known failure modes |
| [SECURITY.md](SECURITY.md) | Encryption details, key management, delete procedures, network policy |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | WCAG contrast, semantic labels, keyboard nav, screen reader support |
| [models/model_card.md](models/model_card.md) | Model methodology, adaptive learning, limitations, biases |

## Getting Started

```bash
# Install dependencies
flutter pub get

# Run on Chrome
flutter run -d chrome

# Run on Android
flutter run
```

## Tech Stack
- **Framework**: Flutter/Dart
- **State Management**: Riverpod 3.x
- **Local DB**: Hive (AES-256 encrypted)
- **Encryption**: flutter_secure_storage (platform keychain)
- **Charts**: fl_chart
- **Voice Input**: speech_to_text
- **Localization**: flutter_localizations (English + Hindi)
- **NLP**: Custom on-device lexicon+rules+negation+adaptive engine (no external APIs)
