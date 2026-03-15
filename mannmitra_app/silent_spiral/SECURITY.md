# Security Policy — MannMitra

## Encryption

### Algorithm & Key Management
| Property | Value |
|---|---|
| **Cipher** | AES-256 via Hive's `HiveAesCipher` |
| **Key size** | 256-bit (32-byte) |
| **Key generation** | `Random.secure()` — cryptographically secure PRNG |
| **Key storage (Android)** | Android KeyStore (hardware-backed on supported devices) |
| **Key storage (iOS)** | iOS Keychain (Secure Enclave on supported devices) |
| **Key storage (Web)** | User-provided passphrase → PBKDF2 key derivation |
| **Library** | `flutter_secure_storage` v9.x |

### What Is Encrypted
| Data | Encrypted? |
|---|---|
| Journal entries (Hive box) | ✅ AES-256 |
| Settings & consent (Hive box) | ✅ AES-256 |
| Adaptive learning data (word overrides) | ✅ AES-256 (in settings box) |
| Temporal patterns | ✅ AES-256 (in settings box) |
| CSV exports | ⚠️ Encrypted by default; plaintext requires explicit confirmation |

### Web Encryption
On web platforms, `flutter_secure_storage` is not available. Instead:
1. User is prompted to create a passphrase on first use
2. Key is derived from passphrase using PBKDF2 (100,000 iterations, SHA-256)
3. Without a passphrase, journal storage is blocked
4. **Warning**: If the passphrase is forgotten, data cannot be recovered

## Delete All Data

### What Is Wiped
When the user selects **Settings → Danger Zone → Delete All Data**:

| Item | Method |
|---|---|
| Journal entries | `journalBox.clear()` — removes all entries from Hive |
| Settings & consent | `settingsBox.clear()` — removes all key-value pairs |
| Word overrides (learned vocabulary) | `settingsBox.delete('word_overrides')` |
| User corrections log | `settingsBox.delete('user_corrections')` |
| Temporal patterns | `settingsBox.delete('temporal_patterns')` |
| Reflection feedback | `settingsBox.delete('reflection_feedback')` |
| Voice consent flag | `settingsBox.delete('voice_consent')` |
| Encryption key | `FlutterSecureStorage.delete(key: 'mannmitra_hive_encryption_key')` |

### Verification
- The user must type **"DELETE"** in a text field before the delete button is enabled
- A confirmation snackbar is shown after deletion
- After deletion, the app is in a clean state equivalent to first launch

## Network Security
| Property | Value |
|---|---|
| **External API calls** | None — all NLP runs 100% on-device |
| **Cloud sync** | Disabled by default (Firestore service is a no-op stub) |
| **Firebase** | `firebase_core` is initialized but no data is transmitted |
| **Speech-to-text** | Platform STT (audio processed by OS, not by MannMitra) |
| **Analytics / telemetry** | None — no tracking of any kind |

## Adaptive Learning Security
- Learned word overrides are stored **locally only** in Hive
- No learned data is ever uploaded to any server
- Activation threshold: **≥5 corrections** per word (prevents noise from misclicks)
- Monthly decay: **20% reduction** per month without reinforcement
- Users can view, remove individual words, or reset all learning from Settings
- Delete All Data wipes all learned vocabulary permanently

## Reporting Vulnerabilities
This is an open-source hackathon project. If you find a security issue:
1. Open a GitHub issue with the `[SECURITY]` tag
2. Do not include exploit details in the public issue
3. Contact the maintainers directly for critical vulnerabilities
