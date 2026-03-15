import 'dart:math';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:silent_spiral/models/journal_entry.dart';
import 'package:silent_spiral/services/local_storage_service.dart';

final patternServiceProvider = Provider<PatternService>((ref) {
  final localDb = ref.read(localStorageProvider);
  return PatternService(localDb);
});

class PatternInsight {
  final String observation;
  final String reflectionPrompt;

  PatternInsight({required this.observation, required this.reflectionPrompt});
}

class PatternService {
  final LocalStorageService _localDb;

  PatternService(this._localDb);

  PatternInsight? getLatestPatternInsight() {
    final entries = _localDb.getAllEntries();
    if (entries.length < 3) return null;

    // Look at the last 7 days of data
    final recentEntries = entries.where((e) {
      return e.timestamp.isAfter(DateTime.now().subtract(const Duration(days: 7)));
    }).toList();
    
    // Sort chronology
    recentEntries.sort((a, b) => a.timestamp.compareTo(b.timestamp));

    if (recentEntries.length < 3) return null;

    // Evaluate trends
    int stressCount = 0;
    int fatigueCount = 0;
    int joyCount = 0;
    int contemplationCount = 0;
    int lateNightCount = 0;
    
    for (var entry in recentEntries) {
      final emotion = (entry.primaryEmotion ?? '').toLowerCase();
      if (emotion == 'sadness' || emotion == 'apprehension' || emotion == 'fear' || emotion == 'anger') {
        stressCount++;
      }
      if (emotion == 'fatigue') {
        fatigueCount++;
      }
      if (emotion == 'joy' || emotion == 'peaceful' || emotion == 'content' || emotion == 'optimistic') {
        joyCount++;
      }
      if (emotion == 'contemplation' || emotion == 'introspection') {
        contemplationCount++;
      }
      if (entry.timestamp.hour >= 1 && entry.timestamp.hour <= 4) {
        lateNightCount++;
      }
    }

    // High Stress Pattern
    if (stressCount >= 3) {
      return PatternInsight(
        observation: "You've logged several moments of high tension recently.",
        reflectionPrompt: "Is there a specific weight you're carrying this week that needs space?",
      );
    }
    
    // Low Energy / Fatigue Pattern
    if (fatigueCount >= 2) {
      return PatternInsight(
        observation: "Your logs show a pattern of low energy over the past few days.",
        reflectionPrompt: "What is one small way you can allow your body to rest today without guilt?",
      );
    }
    
    // Positive Reinforcement Pattern
    if (joyCount >= 3) {
      return PatternInsight(
        observation: "There is a beautiful thread of warmth and peace in your recent reflections.",
        reflectionPrompt: "What boundaries or habits are protecting this peace for you right now?",
      );
    }

    // ── NEW PATTERN: Emotional Whiplash ──
    if (recentEntries.length >= 4) {
      int swingCount = 0;
      for (int i = 1; i < recentEntries.length; i++) {
        final prev = (recentEntries[i - 1].primaryEmotion ?? '').toLowerCase();
        final curr = (recentEntries[i].primaryEmotion ?? '').toLowerCase();
        const positive = ['joy', 'peaceful', 'optimistic'];
        const negative = ['sadness', 'anger', 'apprehension', 'fatigue'];
        if ((positive.contains(prev) && negative.contains(curr)) ||
            (negative.contains(prev) && positive.contains(curr))) {
          swingCount++;
        }
      }
      if (swingCount >= 3) {
        return PatternInsight(
          observation: "Your emotions have been swinging sharply between highs and lows.",
          reflectionPrompt: "What circumstances are triggering these shifts? Sometimes naming the pattern is the first step to steadying it.",
        );
      }
    }

    // ── NEW PATTERN: Academic Pressure ──
    final academicCount = recentEntries.where((e) {
      final text = e.text.toLowerCase();
      return text.contains('#exam') || text.contains('#study') ||
             text.contains('exam') || text.contains('marks') ||
             text.contains('grade') || text.contains('assignment') ||
             text.contains('deadline') || text.contains('submission');
    }).length;
    if (academicCount >= 2 && stressCount >= 2) {
      return PatternInsight(
        observation: "Academic pressure is showing up frequently in your reflections.",
        reflectionPrompt: "What is one exam or deadline that feels most overwhelming right now? Sometimes breaking it into the next single step helps.",
      );
    }

    // ── NEW PATTERN: Emotional Numbness / Shutdown ──
    if (contemplationCount >= 4) {
      return PatternInsight(
        observation: "Your recent entries show a high rate of emotionally neutral reflections.",
        reflectionPrompt: "Sometimes numbness is the body's way of protecting you from overwhelm. What would it feel like to let one small feeling through today?",
      );
    }

    // ── NEW PATTERN: Late-night journaling cluster ──
    if (lateNightCount >= 3) {
      return PatternInsight(
        observation: "You have been journaling very late at night repeatedly.",
        reflectionPrompt: "Late-night writing often surfaces deeper truths. Is something keeping you up, or does nighttime simply feel safer for reflection?",
      );
    }

    return null;
  }

  /// Generate a context-aware journaling prompt based on user history,
  /// time of day, and temporal patterns. This is the core prompt-generation
  /// system described in the problem statement.
  String generateJournalingPrompt() {
    final entries = _localDb.getAllEntries();
    final now = DateTime.now();
    final random = Random();

    // Pool of universal fallback prompts
    const fallbackPrompts = [
      "What is sitting with you right now that hasn't been said yet?",
      "If today had a color, what would it be and why?",
      "What is one thing you noticed about yourself today?",
      "What would feel like enough for today?",
      "Write about something small that caught your attention recently.",
      "What is something you wish someone understood about you?",
      "Describe the space between how you feel and how you appear.",
    ];

    // 1. New user: no entries yet
    if (entries.isEmpty) {
      const newUserPrompts = [
        "Welcome. Take a breath. What brought you here today?",
        "There is no wrong way to start. What is on your mind right now?",
        "This space is yours. What would you like to let go of first?",
      ];
      return newUserPrompts[random.nextInt(newUserPrompts.length)];
    }

    // Sort most recent first
    final sorted = List<JournalEntry>.from(entries)
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    // 2. Gap returner — hasn't journaled in 3+ days
    final daysSinceLast = now.difference(sorted.first.timestamp).inDays;
    if (daysSinceLast >= 3) {
      const returnPrompts = [
        "You have been away for a few days. What has been happening in that space?",
        "Welcome back. Sometimes absence is its own message. What have the last few days felt like?",
        "We missed you here. No pressure — just start with wherever you are right now.",
      ];
      return returnPrompts[random.nextInt(returnPrompts.length)];
    }

    // 3. Yesterday's emotion loop-back
    final yesterday = now.subtract(const Duration(days: 1));
    final yesterdayEntry = sorted.where((e) =>
      e.timestamp.day == yesterday.day &&
      e.timestamp.month == yesterday.month &&
      e.timestamp.year == yesterday.year
    ).toList();
    if (yesterdayEntry.isNotEmpty) {
      final lastEmotion = (yesterdayEntry.first.primaryEmotion ?? '').toLowerCase();
      if (lastEmotion == 'sadness') {
        return "Yesterday carried some heaviness. How does today feel in comparison?";
      } else if (lastEmotion == 'anger') {
        return "Yesterday had some real heat to it. Has anything shifted since then?";
      } else if (lastEmotion == 'joy') {
        return "Yesterday had a bright spot. What is carrying over from that?";
      } else if (lastEmotion == 'apprehension' || lastEmotion == 'fear') {
        return "Yesterday showed some anxiety. Did anything resolve, or is it still lingering?";
      }
    }

    // 4. Time-of-day contextual prompts
    final hour = now.hour;
    if (hour >= 5 && hour < 10) {
      const morningPrompts = [
        "Morning check-in: What does your body feel like right now?",
        "Before the day starts — what is already on your mind?",
        "What is one intention you want to carry through today?",
      ];
      return morningPrompts[random.nextInt(morningPrompts.length)];
    } else if (hour >= 22 || hour < 4) {
      const nightPrompts = [
        "End of day: What stayed with you from today?",
        "If you could replay one moment from today, which would it be?",
        "What do you want to leave behind before sleep?",
      ];
      return nightPrompts[random.nextInt(nightPrompts.length)];
    }

    // 5. Fallback pool
    return fallbackPrompts[random.nextInt(fallbackPrompts.length)];
  }
}
