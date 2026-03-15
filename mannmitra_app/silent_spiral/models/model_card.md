# Model Card — MannMitra Emotion Detector

## Model Overview
| Property | Value |
|---|---|
| **Model Name** | MannMitra Emotion Detector v4.0 |
| **Type** | Rule-based lexicon + negation detection + adaptive learning + multilingual |
| **Architecture** | Multi-phase NLP pipeline: multilingual phrases (Phase 0) → multilingual lexicon (Phase 0.5) → phrase matching → lexicon scan → contrastive reweighting (Phase 2.3) → adaptive learning → health context → negation → intensity modifiers |
| **Runtime** | 100% on-device (Dart) |
| **Latency** | <10ms per entry |
| **Model Size** | ~18KB (embedded word lists + phrase lists + Hinglish/Hindi lexicons) |
| **Lexicon** | ~200 English words + ~120 English phrases + ~120 Hinglish words + ~100 Hinglish phrases + ~60 Hindi words + ~39 Hindi phrases = **~639 triggers** |

## Supported Emotions
| Emotion | Single Words | Phrases | Example Triggers |
|---|---|---|---|
| Joy | 45 words | 21 phrases | happy, grateful, excited, "feel good", "best day", "nailed it" |
| Sadness | 46 words | 36 phrases | sad, lonely, cry, "feel alone", "bad marks", "let down" |
| Anger | 34 words | 19 phrases | angry, frustrated, furious, "pissed off", "so unfair" |
| Apprehension | 35 words | 25 phrases | stress, anxious, panic, "exam pressure", "what if" |
| Fatigue | 20 words | 19 phrases | tired, exhausted, burnout, "brain fog", "all nighter" |
| Contemplation | Fallback | — | (when no strong signal detected) |

## NLP Pipeline Methodology
1. **Apostrophe Normalization**: Curly quotes (`'` `'`) normalized to straight `'` for consistent matching.
2. **Soft Boundary Insertion**: For informal text without punctuation, clause-shift words (but, however, lekin, magar) are wrapped with commas to aid negation detection.
3. **Phase 0 — Multilingual Phrase Detection**: Checks for Devanagari script (≥20% of chars) and Hinglish markers (≥2 matches from 50+ common words). Matched phrases scored at 2.5x weight.
4. **Phase 0.5 — Multilingual Single-Word Lexicon**: Scans ~120 Hinglish and ~60 Hindi emotional words at 1.5x weight with word-boundary checks. Prevents Introspection fallback for unmatched multilingual text.
5. **Multi-Word Phrase Matching**: ~120 English phrases scanned with 2.0x weight (highest priority).
6. **Single-Word Lexicon Scan**: ~200 words scanned via substring matching with 1.0x base weight.
7. **Phase 2.3 — Contrastive Conjunction Reweighting**: When "but", "however", "lekin", "magar" split text, dampens pre-conjunction triggers by 60% (past state) and boosts post-conjunction triggers by 60% (current state). Fixes: "happy yesterday but not happy today" → Sadness.
8. **Adaptive Learning** (Phase 2.5): If user has corrected a trigger word ≥5 times, applies a +2.5 weight bonus to the corrected emotion category. 20% monthly decay.
9. **Health Context Adjustment**: If sleep < 6 hours, fatigue/fear/sadness scores are boosted.
10. **Ground Truth Override**: If user selected an emotion from the UI Emotion Lexicon, that selection overrides NLP output (confidence: 0.92).
11. **Negation Detection**: Clause-aware, word-boundary-safe. 65-character lookback within clause boundaries. Supports standard + Hinglish negators (nahi, bilkul nahi, na). Negated triggers subtract -0.5 from the original category and add +0.7 to the semantically correct opposite.
12. **Intensity Modifiers**: Amplifiers ("very", "extremely", "bahut", "bohot") multiply score by 1.5x. Diminishers ("slightly", "thoda", "kinda") multiply by 0.5x.
13. **Confidence Calculation**: Uses category separation (gap between #1 and #2 scores) for smarter scoring: `confidence = 0.40 + (separation / maxScore) * 0.55`, capped at 0.95.
14. **Vocabulary Builder**: Each emotion result includes a `vocabularyNote` teaching emotional literacy concepts.
15. **Personalized Reflections**: Top 3 trigger phrases are extracted and quoted in the Supportive Lens response.

## Adaptive Learning System
| Property | Value |
|---|---|
| **Type** | On-device incremental learning via user corrections |
| **Storage** | Hive local database (no cloud) |
| **Activation threshold** | ≥5 corrections for a given word |
| **Weight bonus** | +2.5 to corrected category per matching trigger |
| **Data stored** | Word → {emotion: correction_count} map |
| **Temporal patterns** | Emotion frequency by day-of-week × time-bucket |
| **Feedback types** | Thumbs up (positive), Thumbs down + emotion correction |
| **Method label** | `lexicon+rules+negation+adaptive` when corrections are active |

## Known Limitations
- **No deep semantic understanding**: The model matches substrings and phrases, not meaning. Complex sentences with multiple clauses may be misinterpreted.
- **No sarcasm/irony detection**: Sarcastic entries may be misclassified (e.g., "Oh great, another Monday").
- **Simple negation only**: "I couldn't be more happy" (double negation) may be misinterpreted. Only single negation in a 65-char window is detected.
- **Multilingual coverage expanding**: Hinglish (~100 phrases + ~120 words) and Hindi (~39 phrases + ~60 words) are well-supported but may miss niche expressions. English remains the primary language with the deepest lexicon.
- **Contrastive conjunctions**: Phase 2.3 handles common patterns ("X but Y") but complex multi-clause contrasts with 3+ conjunctions may not fully resolve.

## Known Biases
- Entries with more words have more chances of hitting multiple categories, potentially skewing toward the dominant category.
- The fatigue category is artificially boosted when sleep data < 6 hours, which may override textual signals.
- Phrase matching has higher weight (2x), so entries containing specific phrases are weighted more heavily than those using individual words.
- Adaptive learning creates a personalization bias: the model increasingly reflects the user's correction patterns, which may reinforce self-labeling tendencies.

## Training Data
- **None**: This is a rule-based system with no training data. The lexicon was manually curated based on Plutchik's Emotion Wheel and common mental health journaling vocabulary.
- **Adaptive learning**: The model learns from individual user corrections stored on-device. No shared training data across users.

## Recommended Usage
- ✅ Journaling reflection aid
- ✅ Emotion pattern tracking over time
- ✅ Personal vocabulary learning
- ❌ NOT for clinical diagnosis
- ❌ NOT for crisis detection
- ❌ NOT for therapeutic recommendations

## Version History
| Version | Date | Changes |
|---|---|---|
| 1.0 | 2025-02-22 | Initial release with lexicon+rules engine (~102 words) |
| 2.0 | 2025-02-22 | Added negation detection, multi-word phrases (~300 triggers), intensity modifiers, adaptive learning, AES-256 encryption, Hindi localization |
| 3.0 | 2026-03-10 | Updated phrase counts, refined adaptive learning threshold (≥5 corrections), synchronized with v3.0 release |
| 4.0 | 2026-03-14 | Phase 0.5: Hinglish single-word lexicon (~120 words) + Hindi single-word lexicon (~60 words). Phase 2.3: Contrastive conjunction reweighting (but/lekin/magar). Expanded Hinglish phrases to ~100, Hindi phrases to ~39. 65-char negation lookback. Total triggers: ~639. |
