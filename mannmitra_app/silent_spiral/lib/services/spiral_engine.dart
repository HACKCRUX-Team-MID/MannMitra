import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:silent_spiral/models/journal_entry.dart';

final spiralEngineProvider = Provider<SpiralEngine>((ref) {
  return SpiralEngine();
});

/// Represents a single behavioral signal contributing to spiral risk.
class SpiralSignal {
  final String type;
  final double points;
  final String description;
  const SpiralSignal(this.type, this.points, this.description);
}

/// Full result of the spiral risk assessment.
/// CRITICAL: The [score] is NEVER shown to the user. Only [gentleMessage]
/// surfaces when [shouldAlert] is true.
class SpiralRiskResult {
  final double score;
  final List<SpiralSignal> signals;
  final bool shouldAlert;
  final String gentleMessage;
  final int consecutiveNegativeDays;

  const SpiralRiskResult({
    required this.score,
    required this.signals,
    required this.shouldAlert,
    required this.gentleMessage,
    required this.consecutiveNegativeDays,
  });
}

class SpiralEngine {
  /// Multi-signal spiral risk assessment. Takes journal entries directly
  /// and correlates them with health data. All processing is 100% on-device.
  SpiralRiskResult calculateRisk({
    required List<JournalEntry> recentEntries,
    required Map<String, dynamic> healthData,
  }) {
    final signals = <SpiralSignal>[];

    // ── SIGNAL 1: Sleep degradation ──────────────────
    final sleep = (healthData['avg_sleep_hours'] as num?)?.toDouble() ?? 7.0;
    if (sleep < 5.0) {
      signals.add(const SpiralSignal('sleep', 30, 'Sleeping under 5 hours'));
    } else if (sleep < 6.5) {
      signals.add(const SpiralSignal('sleep', 15, 'Sleep below average'));
    }

    // ── SIGNAL 2: Physical withdrawal (steps) ────────
    final steps = (healthData['avg_steps'] as num?)?.toInt() ?? 5000;
    if (steps < 2000) {
      signals.add(const SpiralSignal('mobility', 20, 'Very low movement today'));
    } else if (steps < 4000) {
      signals.add(const SpiralSignal('mobility', 10, 'Below normal activity'));
    }

    // ── SIGNAL 3: Resting heart rate (if available) ──
    final rhr = (healthData['resting_heart_rate'] as num?)?.toInt();
    if (rhr != null && rhr > 90) {
      signals.add(const SpiralSignal('heart_rate', 10, 'Elevated resting heart rate'));
    } else if (rhr != null && rhr > 80) {
      signals.add(const SpiralSignal('heart_rate', 5, 'Slightly elevated heart rate'));
    }

    // ── SIGNAL 4: Consecutive negative emotion days ──
    final sortedEntries = List<JournalEntry>.from(recentEntries)
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    int consecutiveNegDays = 0;
    DateTime? lastDate;
    for (var entry in sortedEntries.take(14)) {
      final entryDate = DateTime(
        entry.timestamp.year, entry.timestamp.month, entry.timestamp.day);
      if (lastDate != null && lastDate.difference(entryDate).inDays > 1) break;

      final emotion = (entry.primaryEmotion ?? '').toLowerCase();
      const negativeEmotions = ['sadness', 'anger', 'apprehension', 'fatigue'];
      if (negativeEmotions.contains(emotion)) {
        consecutiveNegDays++;
        lastDate = entryDate;
      } else {
        break;
      }
    }
    if (consecutiveNegDays >= 7) {
      signals.add(SpiralSignal('emotion_streak', 35, '$consecutiveNegDays consecutive difficult days'));
    } else if (consecutiveNegDays >= 4) {
      signals.add(SpiralSignal('emotion_streak', 20, '$consecutiveNegDays days of emotional weight'));
    }

    // ── SIGNAL 5: Word count shrinkage (emotional shutdown) ──
    if (sortedEntries.length >= 6) {
      final recentWords = sortedEntries.take(3)
        .map((e) => e.text.split(' ').length)
        .fold(0, (a, b) => a + b) / 3.0;
      final priorWords = sortedEntries.skip(3).take(3)
        .map((e) => e.text.split(' ').length)
        .fold(0, (a, b) => a + b) / 3.0;
      if (priorWords > 5 && (recentWords / priorWords) < 0.5) {
        signals.add(const SpiralSignal('word_count', 15, 'Entries getting significantly shorter'));
      }
    }

    // ── SIGNAL 6: Late-night journaling pattern ──────
    final lateNight = sortedEntries.take(7)
      .where((e) => e.timestamp.hour >= 1 && e.timestamp.hour <= 4).length;
    if (lateNight >= 3) {
      signals.add(const SpiralSignal('late_night', 15, 'Journaling late at night repeatedly'));
    }

    // ── SIGNAL 7: Journaling silence (withdrawal gap) ─
    if (sortedEntries.isNotEmpty) {
      final daysSince = DateTime.now().difference(sortedEntries.first.timestamp).inDays;
      if (daysSince >= 5) {
        signals.add(SpiralSignal('silence', 15, '$daysSince day journaling gap'));
      }
    }

    // ── SIGNAL 8: Contemplation/numbness cluster ──────
    final contemplationCount = sortedEntries.take(7)
      .where((e) => (e.primaryEmotion ?? '').toLowerCase() == 'contemplation').length;
    if (contemplationCount >= 4) {
      signals.add(const SpiralSignal('numbness', 10, 'High rate of emotionally neutral entries'));
    }

    // ── SIGNAL 9: Intensity score decline ───────────
    final intensityScores = sortedEntries.take(7)
      .where((e) => (e.intensityScore ?? 0) > 0)
      .map((e) => e.intensityScore!.toDouble())
      .toList();
    if (intensityScores.length >= 4) {
      final recentAvg = intensityScores.take(2).fold(0.0, (a, b) => a + b) / 2;
      final priorAvg = intensityScores.skip(2).take(2).fold(0.0, (a, b) => a + b) / 2;
      if (priorAvg > 0 && (recentAvg / priorAvg) < 0.6) {
        signals.add(const SpiralSignal('vibe_decline', 15, 'Daily mood score has dropped significantly'));
      }
    }

    final totalScore = signals.fold(0.0, (sum, s) => sum + s.points).clamp(0.0, 100.0);

    return SpiralRiskResult(
      score: totalScore,
      signals: signals,
      consecutiveNegativeDays: consecutiveNegDays,
      shouldAlert: totalScore >= 55,
      gentleMessage: _buildGentleMessage(signals, consecutiveNegDays, sleep),
    );
  }

  /// Generates a gentle, non-clinical message for the user.
  /// CRITICAL: The risk score number is NEVER shown. Only this message
  /// surfaces when shouldAlert is true.
  String _buildGentleMessage(
    List<SpiralSignal> signals,
    int consecutiveDays,
    double sleep,
  ) {
    if (consecutiveDays >= 7) {
      return 'You have been carrying something heavy for a while now. '
        'That takes real energy. You do not have to figure it all out today.'
        ' Reaching out to someone you trust might help.';
    }
    if (consecutiveDays >= 4) {
      return 'We have noticed a few heavy days in your reflections. '
        'You are not alone in this. Even one small act of rest or connection '
        'can shift things more than it seems.';
    }
    final hasSleep = signals.any((s) => s.type == 'sleep');
    final hasMobility = signals.any((s) => s.type == 'mobility');
    final hasSilence = signals.any((s) => s.type == 'silence');
    if (hasSilence) {
      return 'We have missed you. Even a few words here can help you see '
        'your own patterns more clearly. No pressure — just here when you are ready.';
    }
    if (hasSleep && hasMobility) {
      return 'Your body might be asking for something. Even a short walk '
        'or an earlier bedtime can shift your emotional landscape more than it seems.';
    }
    if (hasSleep) {
      return 'Sleep below average can amplify every difficult feeling. '
        'What you are experiencing may be partly a body signal. Be gentle with yourself.';
    }
    return 'We have noticed some patterns worth paying attention to. '
      'How are you really doing today?';
  }
}
