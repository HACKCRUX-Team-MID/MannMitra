import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/services/local_storage_service.dart';
import 'package:silent_spiral/ui/widgets/glass_container.dart';
import 'package:silent_spiral/l10n/locale_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Settings & Privacy", style: Theme.of(context).textTheme.titleLarge),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // ── Privacy Center ──
          Text("Privacy Center", style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.accent, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          GlassContainer(
            baseColor: AppTheme.surfaceDarkElevated,
            borderColor: AppTheme.surfaceDarkBorder,
            borderRadius: BorderRadius.circular(20),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _infoRow(Icons.lock_rounded, "Storage Mode", "Local-Only (data never leaves this device)"),
                const Divider(color: AppTheme.surfaceDarkBorder, height: 24),
                _infoRow(Icons.psychology_alt_rounded, "Inference Mode", "On-Device (lexicon+rules engine)"),
                const Divider(color: AppTheme.surfaceDarkBorder, height: 24),
                _infoRow(Icons.cloud_off_rounded, "Cloud Sync", "Disabled by default"),
                const Divider(color: AppTheme.surfaceDarkBorder, height: 24),
                _infoRow(Icons.mic_none_rounded, "Speech-to-Text", "Uses platform default engine (iOS/Android). Audio is processed by the OS and is not sent to our servers."),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // ── Language ──
          Text("Language / भाषा", style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.accent, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Semantics(
            label: 'Language toggle. Switch between English and Hindi.',
            child: GlassContainer(
              baseColor: AppTheme.surfaceDarkElevated,
              borderColor: AppTheme.surfaceDarkBorder,
              borderRadius: BorderRadius.circular(20),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Row(
                children: [
                  const Icon(Icons.translate_rounded, color: AppTheme.accent, size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ref.watch(localeProvider).languageCode == 'hi' ? "हिन्दी" : "English",
                          style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          ref.watch(localeProvider).languageCode == 'hi' ? "Tap to switch to English" : "हिन्दी में बदलें",
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: ref.watch(localeProvider).languageCode == 'hi',
                    onChanged: (_) {
                      ref.read(localeProvider.notifier).toggleLanguage();
                    },
                    activeColor: AppTheme.accent,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),

          // ── About ──
          Text("About", style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.accent, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          GlassContainer(
            baseColor: AppTheme.warmGold.withValues(alpha: 0.05),
            borderColor: AppTheme.warmGold.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(20),
            padding: const EdgeInsets.all(20),
            child: const Text(
              "🛡️ MannMitra is a reflection tool — not a clinical diagnostic application. It does not provide medical advice, diagnoses, or treatment recommendations.",
              style: TextStyle(color: AppTheme.textSecondary, height: 1.5, fontSize: 13),
            ),
          ),
          const SizedBox(height: 32),

          // ── Adaptive Learning Stats ──
          Text("Adaptive Learning", style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.accent, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text("MannMitra learns your personal vocabulary from corrections. All learning happens on-device. Activation: ≥5 corrections per word. Weights decay 20% monthly without reinforcement.",
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12, height: 1.4)),
          const SizedBox(height: 12),
          Builder(builder: (context) {
            final localDb = ref.read(localStorageProvider);
            final correctionCount = localDb.getCorrectionCount();
            final wordOverrides = localDb.getWordOverrides();
            final learnedWords = wordOverrides.keys.length;
            final learnedWordsList = localDb.getLearnedWordsList();
            return GlassContainer(
              baseColor: AppTheme.surfaceDarkElevated,
              borderColor: AppTheme.surfaceDarkBorder,
              borderRadius: BorderRadius.circular(20),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _infoRow(Icons.school_rounded, "Corrections Logged", "$correctionCount corrections"),
                  const Divider(color: AppTheme.surfaceDarkBorder, height: 24),
                  _infoRow(Icons.auto_fix_high_rounded, "Learned Words", "$learnedWords unique words adapted"),
                  const Divider(color: AppTheme.surfaceDarkBorder, height: 24),
                  _infoRow(Icons.trending_up_rounded, "Status", correctionCount >= 5 ? "Active — model is adapting ✨" : "Needs ${5 - correctionCount} more corrections to activate"),
                  if (learnedWordsList.isNotEmpty) ...[
                    const Divider(color: AppTheme.surfaceDarkBorder, height: 24),
                    const Text("Learned Words (tap to remove)", style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 8),
                    ...learnedWordsList.map((entry) {
                      final word = entry['word'] as String;
                      final emotions = entry['emotions'] as Map<String, dynamic>;
                      final lastDate = entry['lastReinforced'] as String;
                      final emotionStr = emotions.entries.map((e) => '${e.key} (${e.value}x)').join(', ');
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Semantics(
                          label: 'Learned word: $word, corrected to $emotionStr, last reinforced $lastDate. Tap to remove.',
                          child: Row(
                            children: [
                              const Icon(Icons.auto_fix_high_rounded, color: AppTheme.accent, size: 14),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '"$word" → $emotionStr  ($lastDate)',
                                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  localDb.removeWordOverride(word);
                                  (context as Element).markNeedsBuild();
                                },
                                child: const Icon(Icons.close_rounded, color: AppTheme.terracotta, size: 16),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              backgroundColor: AppTheme.surfaceDarkElevated,
                              title: const Text("Reset All Learning?", style: TextStyle(color: AppTheme.terracotta)),
                              content: const Text("This will remove all learned words and corrections. The model will start fresh.", style: TextStyle(color: AppTheme.textSecondary)),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel", style: TextStyle(color: AppTheme.textSecondary))),
                                TextButton(
                                  onPressed: () {
                                    localDb.resetAllLearning();
                                    Navigator.pop(ctx);
                                    (context as Element).markNeedsBuild();
                                  },
                                  child: const Text("Reset", style: TextStyle(color: AppTheme.terracotta, fontWeight: FontWeight.w700)),
                                ),
                              ],
                            ),
                          );
                        },
                        icon: const Icon(Icons.restart_alt_rounded, color: AppTheme.terracotta, size: 16),
                        label: const Text("Reset All Learning", style: TextStyle(color: AppTheme.terracotta, fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.terracotta, width: 0.5),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
          const SizedBox(height: 32),

          // ── Crisis Resources ──
          Text("Crisis Resources", style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.terracotta, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          GlassContainer(
            baseColor: AppTheme.terracotta.withValues(alpha: 0.06),
            borderColor: AppTheme.terracotta.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(20),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "If you are in immediate danger or thinking about harming yourself, please reach out for help now.",
                  style: TextStyle(color: AppTheme.textPrimary, height: 1.5, fontSize: 13),
                ),
                const SizedBox(height: 16),
                _crisisLine("🇮🇳 iCall (India)", "9152987821"),
                const SizedBox(height: 8),
                _crisisLine("🇮🇳 Vandrevala Foundation", "1860-2662-345"),
                const SizedBox(height: 8),
                _crisisLine("🇺🇸 988 Suicide & Crisis Lifeline", "988"),
                const SizedBox(height: 8),
                _crisisLine("🌍 Crisis Text Line", "Text HOME to 741741"),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // ── Danger Zone ──
          Text("Danger Zone", style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.terracotta, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _showDeleteConfirmation(context, ref),
              icon: const Icon(Icons.delete_forever_rounded, color: AppTheme.terracotta),
              label: const Text("Delete All Data", style: TextStyle(color: AppTheme.terracotta, fontWeight: FontWeight.w600)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.terracotta),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
          const SizedBox(height: 48),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String title, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppTheme.accent, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12, height: 1.4)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _crisisLine(String name, String number) {
    return Row(
      children: [
        const Icon(Icons.phone_rounded, color: AppTheme.terracotta, size: 16),
        const SizedBox(width: 10),
        Expanded(
          child: Text("$name: $number", style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13)),
        ),
      ],
    );
  }

  void _showDeleteConfirmation(BuildContext context, WidgetRef ref) {
    String typedText = '';
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.surfaceDarkElevated,
          title: const Text("⚠️ Delete All Data?", style: TextStyle(color: AppTheme.terracotta)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "This will permanently delete all your journal entries, custom tags, settings, learned vocabulary, and encryption keys. This action cannot be undone.",
                style: TextStyle(color: AppTheme.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 16),
              const Text("Type DELETE to confirm:", style: TextStyle(color: AppTheme.terracotta, fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 8),
              TextField(
                onChanged: (v) => setDialogState(() => typedText = v),
                style: const TextStyle(color: AppTheme.textPrimary, letterSpacing: 2),
                decoration: InputDecoration(
                  hintText: 'DELETE',
                  hintStyle: TextStyle(color: AppTheme.textSecondary.withValues(alpha: 0.3)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: AppTheme.surfaceDarkBorder),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: AppTheme.terracotta),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel", style: TextStyle(color: AppTheme.textSecondary)),
            ),
            TextButton(
              onPressed: typedText.trim().toUpperCase() == 'DELETE'
                  ? () async {
                      final localDb = ref.read(localStorageProvider);
                      await localDb.deleteAllData();
                      if (context.mounted) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('✅ All data permanently deleted.'),
                            backgroundColor: AppTheme.terracotta,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        );
                      }
                    }
                  : null,
              child: Text(
                "Delete Everything",
                style: TextStyle(
                  color: typedText.trim().toUpperCase() == 'DELETE' ? AppTheme.terracotta : AppTheme.textSecondary.withValues(alpha: 0.3),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
