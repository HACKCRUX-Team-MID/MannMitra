# Annotation Guidelines — MannMitra Emotion Detector

## Purpose
These guidelines define how journal entries in `data/labeled_eval.csv` are labeled for evaluation.

## Annotator
All entries are synthetically generated and labeled by the development team to cover edge cases. No real user data is used.

## Emotion Categories

| Category | Label | Core Signals |
|---|---|---|
| Joy | `Joy` | Happiness, gratitude, excitement, pride, love, satisfaction, relief |
| Sadness | `Sadness` | Loss, loneliness, grief, disappointment, emptiness, regret, crying |
| Anger | `Anger` | Irritation, frustration, rage, blame, betrayal, yelling, hatred |
| Apprehension | `Apprehension` | Stress, anxiety, worry, fear, panic, dread, pressure, nervousness |
| Fatigue | `Fatigue` | Tiredness, exhaustion, burnout, low energy, sleeplessness, brain fog |
| Contemplation | `Contemplation` | Neutral reflection, philosophical thought, no strong emotion signal |

## Labeling Rules

1. **Primary emotion**: Label with the **dominant** emotion. If multiple emotions are present, pick the one the writer would most likely identify with.
2. **Mixed entries**: If roughly equal, label with the emotion that appears **first** in the text.
3. **Negation**: "I am NOT happy" → label as `Sadness` (the writer is expressing absence of joy = sadness).
4. **Sarcasm**: "Oh great, another deadline" → label as `Anger` or `Apprehension` based on context (the literal meaning is positive but intent is negative).
5. **Short entries**: "ugh" → `Anger`; "fine" → `Contemplation`; "meh" → `Fatigue`/`Contemplation`.
6. **Hinglish**: Label based on emotional content regardless of language.
7. **Academic context**: "failed my exam" → `Sadness`; "exam tomorrow" → `Apprehension`.

## Entry Categories in Dataset
| Category | Count | Purpose |
|---|---|---|
| Normal sentences | 100 | Baseline accuracy |
| Negated sentences | 40 | Test negation detection |
| Mixed emotions | 40 | Test multi-emotion handling |
| Short text | 30 | Test fallback behavior |
| Sarcasm | 20 | Known failure mode documentation |
| Academic/exam | 30 | Domain-specific vocabulary |
| Hinglish | 20 | Language edge cases |
| Long entries | 20 | Test phrase matching at scale |
