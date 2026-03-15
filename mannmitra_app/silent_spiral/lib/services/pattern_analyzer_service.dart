import 'package:silent_spiral/models/journal_entry.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:silent_spiral/services/local_storage_service.dart';

final patternAnalyzerProvider = Provider<PatternAnalyzerService>((ref) {
  final storage = ref.read(localStorageProvider);
  return PatternAnalyzerService(storage);
});

class PatternAnalyzerService {
  final LocalStorageService _storage;

  PatternAnalyzerService(this._storage);

  /// Analyzes entries from the last `daysCount` days to detect sustained emotion patterns.
  bool hasSustainedEmotion(String emotion, {int daysCount = 7, int threshold = 4}) {
    final entries = _storage.getAllEntries();
    final cutoff = DateTime.now().subtract(Duration(days: daysCount));
    
    final recentEntries = entries.where((e) => e.timestamp.isAfter(cutoff)).toList();
    
    // Count days where this emotion was primary and intensity > 5
    int daysWithEmotion = 0;
    
    // Group by day to avoid counting multiple entries on the same day as multiple days
    Set<String> days = {};
    for (var entry in recentEntries) {
        if (entry.primaryEmotion?.toLowerCase() == emotion.toLowerCase() && 
            (entry.intensityScore ?? 0) > 5) {
            
            String dateKey = "${entry.timestamp.year}-${entry.timestamp.month}-${entry.timestamp.day}";
            if (!days.contains(dateKey)) {
                days.add(dateKey);
                daysWithEmotion++;
            }
        }
    }
    
    return daysWithEmotion >= threshold;
  }

  /// Check if the user is experiencing Sustained Stress (Apprehension/Fear or Fatigue)
  bool isExperiencingSustainedStress() {
    return hasSustainedEmotion('fear') || hasSustainedEmotion('apprehension') || hasSustainedEmotion('fatigue');
  }

  /// Generate contextual nudges based on behavior
  List<String> generateBehavioralNudges(int sleepHours) {
    List<String> nudges = [];
    
    // Check journaling frequency
    final streak = _storage.calculateStreak();
    final entries = _storage.getAllEntries();
    
    if (entries.isNotEmpty) {
      final lastEntryDate = entries.first.timestamp;
      final daysSinceLastEntry = DateTime.now().difference(lastEntryDate).inDays;
      
      if (daysSinceLastEntry >= 3) {
          nudges.add("It's been a few days since your last reflection. Checking in with your thoughts might help you stay aware of how you're feeling.");
      }
    }
    
    // Sleep correlates
    if (sleepHours < 6 && isExperiencingSustainedStress()) {
        nudges.add("Your recent entries suggest stress during short sleep cycles. Prioritizing rest might help clear your mind.");
    }
    
    return nudges;
  }
}
