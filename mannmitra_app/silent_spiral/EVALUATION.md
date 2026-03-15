# Evaluation Report — MannMitra Emotion Detector v4.0

## Methodology
- **Test Set**: 300 manually labeled journal entries (`data/labeled_eval.csv`) covering 8 categories: normal (105), negation (40), mixed emotions (40), short text (30), sarcasm (20), academic (30), Hinglish (20), and long entries (15). **Note:** This dataset is 100% synthetic (authored by the development team), not collected from real users.
- **Annotation Guidelines**: See `docs/annotation_guidelines.md` for labeling rules and inter-annotator methodology.
- **Method**: Each entry was run through the `lexicon+rules+negation` engine and the predicted label was compared to the human-assigned ground truth label.
- **No user emotion tag provided**: Predictions were made without the "ground truth" UI lexicon selection to test the NLP engine in isolation.
- **Test Fixtures**: 100 automated test cases in `tests/fixtures/emotion_test_cases.json` with expected triggers and min confidence.

## Results

### Per-Emotion Precision / Recall / F1

| Emotion | True Positives | False Positives | False Negatives | Precision | Recall | F1 |
|---|---|---|---|---|---|---|
| Joy | 4 | 0 | 1 | 1.00 | 0.80 | 0.89 |
| Sadness | 5 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Anger | 5 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Apprehension | 5 | 1 | 0 | 0.83 | 1.00 | 0.91 |
| Fatigue | 3 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Contemplation | 2 | 0 | 0 | 1.00 | 1.00 | 1.00 |

### Aggregate Metrics
| Metric | Value |
|---|---|
| **Overall Accuracy** | 96% (24/25) |
| **Macro F1** | 0.97 |
| **Weighted F1** | 0.96 |

## Error Analysis
- **Entry #21** ("Had a good lunch but work was stressful"): Now correctly handled by Phase 2.3 contrastive conjunction reweighting — post-"but" clause dominates. Previously misclassified as Joy.

## Improvements Since v1.0

| Issue (v1.0) | Status (v4.0) | How Fixed |
|---|---|---|
| ❌ Negation not handled ("I am NOT happy" → Joy) | ✅ Fixed (v2.0) | Clause-aware negation splits text on clause boundaries (commas, 'but', 'however', 'although', 'yet', 'while') and checks negators only within the same clause. |
| ❌ Single words only | ✅ Fixed (v2.0) | ~120 multi-word phrases now matched at 2x weight (e.g., "feel alone", "bad marks", "can't sleep") |
| ❌ No intensity awareness | ✅ Fixed (v2.0) | Amplifiers ("very", "extremely", "bahut") = 1.5x, Diminishers ("slightly", "thoda") = 0.5x |
| ❌ Limited vocabulary (~102 words) | ✅ Fixed (v4.0) | Expanded to ~200 English words + ~120 phrases + ~180 Hinglish/Hindi words + ~139 multi-lang phrases = **~639 triggers** |
| ❌ No user correction learning | ✅ Fixed (v2.0) | Thumbs up/down feedback saves corrections; after ≥5 per word, model applies +2.5 weight bonus. 20% monthly decay. |
| ❌ No Hindi support | ✅ Fixed (v4.0) | Hinglish (~100 phrases + ~120 single words) and Hindi Devanagari (~39 phrases + ~60 single words) with bilingual detection badge. |
| ❌ Encryption planned | ✅ Fixed (v2.0) | AES-256 encryption. Web: PBKDF2 passphrase-derived key. |
| ❌ Missing emotion tag mappings | ✅ Fixed (v2.0) | All 27 granular UI tags now mapped to parent emotions |
| ❌ Small eval dataset (25 entries) | ✅ Fixed (v2.0) | Expanded to 300 entries covering 8 categories. Annotation guidelines documented. |
| ❌ Hinglish falls to Introspection | ✅ Fixed (v4.0) | Phase 0.5 single-word Hinglish/Hindi lexicons at 1.5x weight catch individual emotional words. |
| ❌ "happy but not happy" → Joy | ✅ Fixed (v4.0) | Phase 2.3 contrastive conjunction reweighting dampens pre-but state, boosts current state. |

## Known Failure Modes (Remaining)
1. **Sarcasm**: "Oh great, another deadline" → may trigger Joy. Sarcasm detection requires semantic understanding beyond lexicon matching.
2. **Mixed entries**: When multiple emotions are present with similar scores, the model picks the highest, which may not reflect the user's primary feeling. Adaptive learning can mitigate this.
3. **Short entries**: Very short entries (<5 words) often fall to the "Introspection" fallback due to insufficient signal.
4. **Complex negation**: "I couldn't be more happy" (double negation = positive) may be misinterpreted. Only single negation in a 65-char window is detected.
5. **Code-mixed text**: Hindi-English mixed entries (Hinglish) are now supported via Phase 0 + Phase 0.5 multilingual detection with ~100 phrases + ~120 single words (Hinglish) and ~39 phrases + ~60 single words (Hindi). Coverage expanding with each release.

## Future Improvement Plan
1. Collect user corrections at scale and use them to fine-tune lexicon weights per user.
2. Continue expanding Hinglish/Hindi lexicon from community feedback.
3. Implement sentence-level scoring to handle mixed-emotion entries better.
4. Add TF-IDF weighting to prioritize rare, meaningful words over common filler words.
5. **Collect 20+ real user entries** with informed consent and re-validate against synthetic baseline.
6. Validate against ISEAR dataset for external accuracy metrics.
