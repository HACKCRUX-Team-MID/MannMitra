import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:silent_spiral/models/journal_entry.dart';
import 'package:silent_spiral/models/user_profile.dart';

final localStorageProvider = Provider<LocalStorageService>((ref) {
  return LocalStorageService();
});

class LocalStorageService {
  static const String _journalBoxName = 'journal_entries';
  static const String _settingsBoxName = 'settings';
  static const String _userProfileBoxName = 'user_profile';

  Future<void> init() async {
    await Hive.initFlutter();
    Hive.registerAdapter(JournalEntryAdapter());
    await Hive.openBox<JournalEntry>(_journalBoxName);
    await Hive.openBox(_settingsBoxName);
    await Hive.openBox(_userProfileBoxName);
  }

  Box<JournalEntry> get journalBox => Hive.box<JournalEntry>(_journalBoxName);
  Box get settingsBox => Hive.box(_settingsBoxName);
  Box get userProfileBox => Hive.box(_userProfileBoxName);

  // Custom Tags Management
  List<String> getCustomTags() {
    final list = settingsBox.get('custom_tags', defaultValue: <String>[]);
    return List<String>.from(list);
  }

  Future<void> saveCustomTags(List<String> tags) async {
    await settingsBox.put('custom_tags', tags);
  }

  // User Profile
  UserProfile getUserProfile() {
    final raw = userProfileBox.get('profile_data');
    if (raw == null) return UserProfile.empty();
    return UserProfile.fromJson(Map<String, dynamic>.from(raw));
  }

  Future<void> saveUserProfile(UserProfile profile) async {
    await userProfileBox.put('profile_data', profile.toJson());
  }

  Future<void> saveEntry(JournalEntry entry) async {
    await journalBox.put(entry.id, entry);
  }

  List<JournalEntry> getAllEntries() {
    final entries = journalBox.values.toList();
    entries.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return entries;
  }
  
  Future<void> deleteEntry(String id) async {
    await journalBox.delete(id);
  }

  int calculateStreak() {
    final entries = getAllEntries();
    if (entries.isEmpty) return 0;

    // Sort by descending date
    final dates = entries.map((e) => DateTime(e.timestamp.year, e.timestamp.month, e.timestamp.day)).toSet().toList();
    dates.sort((a, b) => b.compareTo(a));

    int streak = 0;
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    final yesterday = today.subtract(const Duration(days: 1));

    // If they haven't journaled today or yesterday, streak is broken
    if (dates.first != today && dates.first != yesterday) {
      return 0;
    }

    DateTime currentExpected = dates.first;
    for (int i = 0; i < dates.length; i++) {
      if (dates[i] == currentExpected) {
        streak++;
        currentExpected = currentExpected.subtract(const Duration(days: 1));
      } else {
        break; // Streak broken
      }
    }

    return streak;
  }

  /// Has the user given onboarding consent?
  bool hasConsented() {
    return settingsBox.get('has_consented', defaultValue: false) == true;
  }

  Future<void> setConsented(bool value) async {
    await settingsBox.put('has_consented', value);
  }

  /// Permanently delete ALL user data (entries, tags, settings, learned data).
  Future<void> deleteAllData() async {
    await journalBox.clear();
    await settingsBox.clear();
    await userProfileBox.clear(); // Added for complete privacy wipe
    // Explicitly wipe all adaptive learning keys
    await settingsBox.delete('user_corrections');
    await settingsBox.delete('word_overrides');
    await settingsBox.delete('temporal_patterns');
    await settingsBox.delete('reflection_feedback');
    await settingsBox.delete('voice_consent');
  }

  // ══════════════════════════════════════════════════════════
  //  VOICE CONSENT
  // ══════════════════════════════════════════════════════════

  /// Has the user consented to voice input?
  bool hasVoiceConsent() {
    return settingsBox.get('voice_consent', defaultValue: false) == true;
  }

  Future<void> setVoiceConsent(bool value) async {
    await settingsBox.put('voice_consent', value);
  }

  // ══════════════════════════════════════════════════════════
  //  ADAPTIVE LEARNING — On-Device Only
  // ══════════════════════════════════════════════════════════

  /// Save a user correction: maps trigger words to the corrected emotion.
  /// Over time, this builds a personal vocabulary that overrides the default lexicon.
  /// Activation threshold: ≥5 corrections per word (prevents noise from misclicks).
  Future<void> saveCorrection({
    required String entryId,
    required String originalEmotion,
    required String correctedEmotion,
    required List<String> triggerWords,
  }) async {
    // Store the correction log
    final corrections = getCorrections();
    corrections.add({
      'entryId': entryId,
      'original': originalEmotion,
      'corrected': correctedEmotion,
      'triggers': triggerWords,
      'timestamp': DateTime.now().toIso8601String(),
    });
    await settingsBox.put('user_corrections', corrections);

    // Update word-level overrides with last_reinforced timestamp
    final overrides = _getRawWordOverrides();
    for (var word in triggerWords) {
      final key = word.toLowerCase().trim();
      if (key.isEmpty) continue;
      final existing = overrides[key] as Map<String, dynamic>? ?? {};
      final count = (existing[correctedEmotion] as int? ?? 0) + 1;
      existing[correctedEmotion] = count;
      existing['_last_reinforced'] = DateTime.now().toIso8601String();
      overrides[key] = existing;
    }
    await settingsBox.put('word_overrides', overrides);
  }

  /// Get all stored corrections.
  List<Map<String, dynamic>> getCorrections() {
    final raw = settingsBox.get('user_corrections', defaultValue: <dynamic>[]);
    return List<Map<String, dynamic>>.from(
      (raw as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  /// Get raw word overrides without decay (for internal use).
  Map<String, dynamic> _getRawWordOverrides() {
    final raw = settingsBox.get('word_overrides', defaultValue: <dynamic, dynamic>{});
    return Map<String, dynamic>.from(raw as Map);
  }

  /// Get the learned word → emotion override map.
  /// Applies monthly 20% decay: weights decay if not reinforced within 30 days.
  /// Format: { "word": { "Sadness": 3, "Joy": 1 } }
  Map<String, dynamic> getWordOverrides() {
    final overrides = _getRawWordOverrides();
    final now = DateTime.now();
    final decayed = <String, dynamic>{};

    overrides.forEach((word, value) {
      if (value is Map) {
        final entry = Map<String, dynamic>.from(value);
        final lastReinforced = entry['_last_reinforced'] as String?;
        if (lastReinforced != null) {
          final lastDate = DateTime.tryParse(lastReinforced);
          if (lastDate != null) {
            final monthsStale = now.difference(lastDate).inDays ~/ 30;
            if (monthsStale > 0) {
              // Apply 20% decay per month without reinforcement
              final decayFactor = 1.0 - (0.2 * monthsStale);
              if (decayFactor <= 0) return; // Word has fully decayed, skip it
              entry.forEach((k, v) {
                if (k != '_last_reinforced' && v is int) {
                  final decayedCount = (v * decayFactor).round();
                  if (decayedCount > 0) entry[k] = decayedCount;
                }
              });
            }
          }
        }
        // Remove internal metadata before returning
        final cleaned = Map<String, dynamic>.from(entry);
        cleaned.remove('_last_reinforced');
        if (cleaned.isNotEmpty) decayed[word] = cleaned;
      }
    });

    return decayed;
  }

  /// Remove a specific learned word override (undo learning for one word).
  Future<void> removeWordOverride(String word) async {
    final overrides = _getRawWordOverrides();
    overrides.remove(word.toLowerCase().trim());
    await settingsBox.put('word_overrides', overrides);
  }

  /// Reset ALL learned words and corrections (full learning reset).
  Future<void> resetAllLearning() async {
    await settingsBox.put('word_overrides', <dynamic, dynamic>{});
    await settingsBox.put('user_corrections', <dynamic>[]);
    await settingsBox.put('reflection_feedback', <dynamic>[]);
  }

  /// Get a UI-friendly list of learned words with counts and dates.
  /// Returns: [ { 'word': 'exams', 'emotions': {'Sadness': 5}, 'lastReinforced': '2025-02-22' } ]
  List<Map<String, dynamic>> getLearnedWordsList() {
    final overrides = _getRawWordOverrides();
    final result = <Map<String, dynamic>>[];
    overrides.forEach((word, value) {
      if (value is Map) {
        final entry = Map<String, dynamic>.from(value);
        final lastReinforced = entry.remove('_last_reinforced') as String? ?? '';
        if (entry.isNotEmpty) {
          result.add({
            'word': word,
            'emotions': Map<String, dynamic>.from(entry),
            'lastReinforced': lastReinforced.isNotEmpty
                ? lastReinforced.substring(0, 10) // Just the date part
                : 'Unknown',
          });
        }
      }
    });
    return result;
  }

  /// Record an emotion at a specific timestamp for temporal pattern learning.
  Future<void> saveEmotionTimestamp(String emotion) async {
    final patterns = getTemporalPatterns();
    final dayOfWeek = DateTime.now().weekday.toString(); // 1=Mon, 7=Sun
    final hourBucket = (DateTime.now().hour ~/ 6).toString(); // 0=night, 1=morning, 2=afternoon, 3=evening

    final key = '${dayOfWeek}_$hourBucket';
    final existing = patterns[key] as Map<String, dynamic>? ?? {};
    existing[emotion] = (existing[emotion] as int? ?? 0) + 1;
    patterns[key] = existing;
    await settingsBox.put('temporal_patterns', patterns);
  }

  /// Get temporal patterns: { "1_2": { "Sadness": 5, "Joy": 2 } } (Monday afternoon)
  Map<String, dynamic> getTemporalPatterns() {
    final raw = settingsBox.get('temporal_patterns', defaultValue: <dynamic, dynamic>{});
    return Map<String, dynamic>.from(raw as Map);
  }

  /// Save whether the user liked (true) or disliked (false) a specific reflection.
  Future<void> saveReflectionFeedback({
    required String emotion,
    required String reflectionText,
    required bool liked,
  }) async {
    final feedback = getReflectionFeedback();
    feedback.add({
      'emotion': emotion,
      'text': reflectionText,
      'liked': liked,
      'timestamp': DateTime.now().toIso8601String(),
    });
    // Keep only last 50 feedback entries to avoid unbounded growth
    if (feedback.length > 50) {
      feedback.removeRange(0, feedback.length - 50);
    }
    await settingsBox.put('reflection_feedback', feedback);
  }

  /// Get all stored reflection feedback.
  List<Map<String, dynamic>> getReflectionFeedback() {
    final raw = settingsBox.get('reflection_feedback', defaultValue: <dynamic>[]);
    return List<Map<String, dynamic>>.from(
      (raw as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  /// Get the total correction count (useful for UI display).
  int getCorrectionCount() {
    return getCorrections().length;
  }

  // ══════════════════════════════════════════════════════════
  //  TEMPORAL INSIGHT — Surface stored temporal patterns
  // ══════════════════════════════════════════════════════════
  /// Returns a human-readable insight from the temporal patterns
  /// already collected by saveTemporalPattern(). Returns null if
  /// insufficient data.
  String? getTemporalInsight() {
    final patterns = getTemporalPatterns();
    if (patterns.isEmpty) return null;

    const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = ['morning', 'afternoon', 'evening', 'night'];

    // Find the time slot with the highest count of any single emotion
    String? strongestEmotion;
    int highestCount = 0;
    int bestDay = 0;
    int bestSlot = 0;

    patterns.forEach((key, value) {
      if (value is Map) {
        final parts = key.split('_');
        if (parts.length == 2) {
          final day = int.tryParse(parts[0]) ?? 0;
          final slot = int.tryParse(parts[1]) ?? 0;
          value.forEach((emotion, count) {
            final c = (count as num).toInt();
            if (c > highestCount) {
              highestCount = c;
              strongestEmotion = emotion.toString();
              bestDay = day;
              bestSlot = slot;
            }
          });
        }
      }
    });

    if (strongestEmotion == null || highestCount < 2) return null;

    final dayName = (bestDay >= 1 && bestDay <= 7) ? dayNames[bestDay] : 'some days';
    final slotName = (bestSlot >= 0 && bestSlot < timeSlots.length) ? timeSlots[bestSlot] : '';

    return 'You tend to feel $strongestEmotion on ${dayName}s in the $slotName.';
  }

  // ══════════════════════════════════════════════════════════
  //  WEEKLY EMOTION SLOPE — Direction indicator
  // ══════════════════════════════════════════════════════════
  /// Compares the emotional valence of recent entries vs earlier entries
  /// to determine if the user is improving (+1), stable (0), or declining (-1).
  int getWeeklyEmotionSlope() {
    final entries = getAllEntries();
    if (entries.length < 4) return 0;

    final sorted = List.from(entries)
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    // Score valence: positive emotions = +1, negative = -1, neutral = 0
    double valence(dynamic entry) {
      final emotion = ((entry.primaryEmotion ?? '') as String).toLowerCase();
      const positive = ['joy', 'peaceful', 'optimistic'];
      const negative = ['sadness', 'anger', 'apprehension', 'fatigue', 'fear'];
      if (positive.contains(emotion)) return 1.0;
      if (negative.contains(emotion)) return -1.0;
      return 0.0;
    }

    // Compare recent half vs earlier half
    final half = (sorted.length / 2).ceil();
    final recentHalf = sorted.take(half);
    final earlierHalf = sorted.skip(half).take(half);

    final recentAvg = recentHalf.fold(0.0, (double sum, e) => sum + valence(e)) / half;
    final earlierAvg = earlierHalf.fold(0.0, (double sum, e) => sum + valence(e)) / half;

    final diff = recentAvg - earlierAvg;
    if (diff > 0.3) return 1;   // Improving
    if (diff < -0.3) return -1; // Declining
    return 0;                    // Stable
  }
}
