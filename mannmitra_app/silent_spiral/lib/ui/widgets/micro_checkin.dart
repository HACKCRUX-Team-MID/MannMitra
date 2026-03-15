import 'package:flutter/material.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/ui/widgets/glass_container.dart';
import 'package:flutter_animate/flutter_animate.dart';

class MicroCheckIn extends StatefulWidget {
  final Function(double) onLogRhythm;

  const MicroCheckIn({super.key, required this.onLogRhythm});

  @override
  State<MicroCheckIn> createState() => _MicroCheckInState();
}

class _MicroCheckInState extends State<MicroCheckIn> {
  double _vibeValue = 5.0;
  bool _isLogged = false;

  String _getVibeEmoji() {
    if (_vibeValue <= 2) return '😔';
    if (_vibeValue <= 4) return '😐';
    if (_vibeValue <= 6) return '🙂';
    if (_vibeValue <= 8) return '😊';
    return '🤩';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLogged) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        alignment: Alignment.center,
        child: Text(
          "✨ Rhythm logged. You're doing great.",
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppTheme.accent,
            fontStyle: FontStyle.italic,
          ),
        ).animate().fade().slideY(begin: 0.2),
      );
    }

    return GlassContainer(
      baseColor: AppTheme.surfaceDarkElevated,
      borderColor: AppTheme.accent,
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "⚡ Quick Vibe Check",
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppTheme.accent,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(_getVibeEmoji(), style: const TextStyle(fontSize: 24)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            "How's your rhythm right now?",
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Text('😔', style: TextStyle(fontSize: 16)),
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: AppTheme.accent,
                    inactiveTrackColor: AppTheme.surfaceDarkBorder,
                    thumbColor: AppTheme.warmGold,
                    overlayColor: AppTheme.accent.withValues(alpha: 0.2),
                    trackHeight: 4,
                  ),
                  child: Slider(
                    value: _vibeValue,
                    min: 1,
                    max: 10,
                    divisions: 9,
                    onChanged: (val) => setState(() => _vibeValue = val),
                    onChangeEnd: (val) {
                      widget.onLogRhythm(val);
                      setState(() => _isLogged = true);
                    },
                  ),
                ),
              ),
              const Text('🤩', style: TextStyle(fontSize: 16)),
            ],
          ),
        ],
      ),
    );
  }
}
