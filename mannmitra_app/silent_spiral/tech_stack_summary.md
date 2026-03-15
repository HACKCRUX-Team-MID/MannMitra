### Frontend
*   **Flutter (Dart)**: Core mobile UI framework for cross-platform app rendering.
*   **flutter_riverpod**: Used for robust, predictable state management across the app.
*   **google_fonts**: Provides custom typography (e.g., Outfit) for improved UI aesthetics.
*   **flutter_animate**: Adds subtle micro-animations for state transitions and visual polish.
*   **fl_chart**: Used to render local analytics graphs (like the 30-Day Mood Heatmap).
*   **flutter_localizations**: Enables the built-in English/Hindi language toggling.

### Backend / Local Logic
*   *local-only.*

### Database / Storage
*   **hive & hive_flutter**: Fast, lightweight NoSQL local database used to store journal entries and adaptive learning settings.
*   **flutter_secure_storage**: Securely stores the AES-256 encryption key in the platform's native keystore (Android KeyStore / iOS Keychain).

### AI / NLP
*   **Custom On-Device NLP Engine**: The `LLMService` class implements a multi-phase rule-based pipeline with ~639 triggers across English, Hinglish, and Hindi. Includes clause-aware negation (65-char lookback), contrastive conjunction reweighting (Phase 2.3 for "but"/"lekin"), multilingual single-word lexicons (Phase 0.5), and intensity modifiers.
*   *Note: `firebase_vertexai` and `google_generative_ai` are listed in `pubspec.yaml`, but a search of the `lib/` directory shows no usage in the active source code. The app is currently using the local `LLMService`.*
*   *No cloud inference / no third-party NLP APIs detected in active code.*

### ML / Pattern Recognition
*   **Adaptive Learning Feedback Loop**: Found in `LLMService`, it applies weight bonuses based on a local override map populated by user corrections (👍/👎).

### Integrations
*   **health**: Handles requesting and reading Health Connect (Android) / HealthKit (iOS) data like sleep and steps.
*   **speech_to_text**: Integrates with the OS-level microphone and speech recognition for voice journaling.
*   **permission_handler**: Manages granular system permission requests for microphone and health data.
*   **flutter_local_notifications**: Allows the app to schedule local notification reminders.

### Security & Privacy
*   **AES-256 Encryption**: Used natively via Hive's `HiveAesCipher` to encrypt all local database boxes.
*   **Local PBKDF2 Key Derivation**: Implemented for web platforms where native secure storage isn't available (noted in architecture docs/code).

### Dev Tools & CI
*   **flutter_test**: The default Flutter testing framework for unit and widget tests.
*   **flutter_lints**: Enforces Dart code quality and style guidelines.
