# Privacy & Data Policy — MannMitra

## Data Collection
MannMitra collects the following data:
- **Journal entries**: Text you type or dictate.
- **Emotion tags**: Selected from the Emotion Lexicon or auto-detected via on-device NLP.
- **Context tags**: Optional tags like #Work, #Exams selected by the user.
- **Quick Vibe Check**: A daily mood slider value (1-10).
- **Feedback corrections**: Thumbs up/down and emotion correction data (stored locally for adaptive learning).
- **Temporal patterns**: Emotion frequency by day-of-week and time-of-day (aggregated, never exported).

## Storage
| Property | Value |
|---|---|
| **Default mode** | Local-only (on-device) |
| **Database** | Hive (Flutter local DB) |
| **Encryption** | AES-256. Encryption key stored in platform secure enclave (Android KeyStore / iOS Keychain). |
| **Cloud sync** | Disabled by default. No data is uploaded to any server. |
| **Adaptive learning data** | User corrections, word overrides, temporal patterns — all stored locally in Hive settings box. |

## Inference & NLP
| Property | Value |
|---|---|
| **Method** | `lexicon+rules+negation+adaptive[+hinglish/+hindi]` (on-device Dart engine) |
| **Lexicon size** | ~200 English words + ~120 phrases + ~180 Hinglish/Hindi words + ~139 multi-lang phrases = **~639 triggers** |
| **Negation detection** | 65-character lookback window with clause boundaries and apostrophe normalization |
| **Contrastive conjunctions** | Phase 2.3: "but"/"lekin"/"magar" dampens past-state, boosts current-state |
| **Adaptive learning** | User corrections create personal vocabulary overrides (≥5 corrections → +2.5 weight bonus, 20% monthly decay) |
| **External API calls** | None. No data is sent to OpenAI, Google, or any third-party NLP service. |
| **Speech-to-text** | Uses the platform's default STT engine (iOS Siri / Android Google). Audio is processed by the OS, not by our servers. |

## Localization
| Property | Value |
|---|---|
| **Supported languages** | English, Hindi (हिन्दी), Hinglish (code-mixed) |
| **Language toggle** | Settings → Language / भाषा |
| **Translation coverage** | ~100 UI strings + ~639 NLP triggers across 3 languages |

## User Rights
- **Export**: You can export all your data as a CSV file at any time from the Insights screen.
- **Delete**: You can permanently delete all data via Settings > Danger Zone > Delete All Data. This wipes all journal entries, tags, settings, learned vocabulary, and encryption keys from the device.
- **Consent**: A mandatory consent screen is shown on first launch. You must explicitly agree before using the app.
- **Correction**: You can correct the AI's emotion detection via the thumbs up/down feedback buttons. Your corrections are stored locally and used to improve future accuracy for you.

## What We Do NOT Do
- ❌ We do not upload your journal text to any server.
- ❌ We do not log, track, or transmit your personal reflections.
- ❌ We do not provide clinical diagnoses or medical advice.
- ❌ We do not share data with third parties.
- ❌ We do not send your corrections or learned vocabulary to any external service.

## Encryption Details
| Property | Value |
|---|---|
| **Algorithm** | AES-256 (via Hive's `HiveAesCipher`) |
| **Key generation** | 256-bit (32-byte) cryptographically secure random key |
| **Key storage** | Platform secure enclave: Android KeyStore / iOS Keychain |
| **Web fallback** | Deterministic key derivation (web has no secure storage API) |
| **Key deletion** | Encryption key is deleted when user selects "Delete All Data" |

## Crisis Resources
If you are in immediate danger or thinking about harming yourself:
- 🇮🇳 iCall (India): 9152987821
- 🇮🇳 Vandrevala Foundation: 1860-2662-345
- 🇺🇸 988 Suicide & Crisis Lifeline: 988
- 🌍 Crisis Text Line: Text HOME to 741741

## Retention Policy
Data is retained only on the user's device until manually deleted. There is no server-side retention. Adaptive learning data (corrections and word overrides) is also local-only and deleted with "Delete All Data".
