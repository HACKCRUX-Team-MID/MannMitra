import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/ui/widgets/glass_container.dart';

class EmotionAvatar extends StatelessWidget {
  final String? dominantEmotion;
  final int reflectionCount;

  const EmotionAvatar({
    super.key,
    this.dominantEmotion,
    required this.reflectionCount,
  });

  @override
  Widget build(BuildContext context) {
    final emoji = _getEmoji();
    final label = _getLabel();
    final Color glowColor = _getGlowColor();

    return Center(
      child: Column(
        children: [
          // Avatar Circle
          Container(
            width: 180,
            height: 180,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  glowColor.withValues(alpha: 0.3),
                  glowColor.withValues(alpha: 0.05),
                  Colors.transparent,
                ],
                stops: const [0.3, 0.7, 1.0],
              ),
              boxShadow: [
                BoxShadow(
                  color: glowColor.withValues(alpha: 0.25),
                  blurRadius: 60,
                  spreadRadius: 20,
                ),
              ],
            ),
            child: Center(
              child: Text(
                emoji,
                style: const TextStyle(fontSize: 80),
              ).animate(onPlay: (c) => c.repeat(reverse: true))
               .scale(begin: const Offset(0.95, 0.95), end: const Offset(1.05, 1.05), duration: 3.seconds, curve: Curves.easeInOut),
            ),
          ).animate(onPlay: (c) => c.repeat(reverse: true))
           .scale(begin: const Offset(0.98, 0.98), end: const Offset(1.02, 1.02), duration: 4.seconds, curve: Curves.easeInOut),
          
          const SizedBox(height: 20),
          
          // Emotion Label
          GlassContainer(
            baseColor: AppTheme.surfaceDarkElevated,
            borderColor: glowColor.withValues(alpha: 0.4),
            borderRadius: BorderRadius.circular(30),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: glowColor,
                    boxShadow: [
                      BoxShadow(color: glowColor, blurRadius: 6, spreadRadius: 1),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: glowColor,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ).animate().fade(delay: 300.ms).slideY(begin: 0.2),
          
          const SizedBox(height: 8),
          
          Text(
            _getTimeGreeting(),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textSecondary,
              fontStyle: FontStyle.italic,
            ),
          ).animate().fade(delay: 500.ms),
        ],
      ),
    );
  }

  String _getEmoji() {
    if (reflectionCount == 0) return '🌙';
    
    switch (dominantEmotion?.toLowerCase()) {
      case 'joy': return '😊';
      case 'sadness': return '😢';
      case 'anger': return '😤';
      case 'fear': case 'apprehension': return '😰';
      case 'surprise': return '😲';
      case 'disgust': return '🤢';
      case 'fatigue': return '😴';
      case 'contemplation': return '🤔';
      case 'ambivalence': return '😶';
      case 'introspection': return '🧘';
      case 'peaceful': return '🌿';
      default: return '💭';
    }
  }

  String _getLabel() {
    if (reflectionCount == 0) return "No reflections yet today";
    if (dominantEmotion == null) return "Reflecting...";
    return "Feeling $dominantEmotion";
  }

  Color _getGlowColor() {
    switch (dominantEmotion?.toLowerCase()) {
      case 'joy': case 'peaceful': return AppTheme.warmGold;
      case 'sadness': return AppTheme.cyan;
      case 'anger': return AppTheme.terracotta;
      case 'fear': case 'apprehension': return const Color(0xFFCE93D8);
      case 'fatigue': return AppTheme.deepOceanBlue;
      default: return AppTheme.accent;
    }
  }

  String _getTimeGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return "Good morning ☀️";
    if (hour < 17) return "Good afternoon 🌤️";
    if (hour < 21) return "Good evening 🌅";
    return "Night owl hours 🌙";
  }
}
