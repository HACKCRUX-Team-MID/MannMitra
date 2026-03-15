import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:silent_spiral/models/journal_entry.dart';

final firestoreServiceProvider = Provider<FirestoreService>((ref) {
  return FirestoreService();
});

/// Cloud sync is DISABLED by default to enforce local-only storage.
/// This service is a no-op stub to satisfy existing references.
/// If the user explicitly opts in to cloud sync in the future,
/// this service would be re-enabled with E2E encryption.
class FirestoreService {
  FirestoreService();

  /// No-op: Cloud sync is disabled for privacy-first architecture.
  Future<void> syncEntryToCloud(JournalEntry entry) async {
    // Intentionally disabled. Data stays on-device only.
    // To re-enable, implement E2E encryption before upload.
  }
}
