import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:silent_spiral/core/theme.dart';

class GroundingBreathingHalo extends StatefulWidget {
  final VoidCallback onComplete;

  const GroundingBreathingHalo({super.key, required this.onComplete});

  @override
  State<GroundingBreathingHalo> createState() => _GroundingBreathingHaloState();
}

class _GroundingBreathingHaloState extends State<GroundingBreathingHalo> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) widget.onComplete();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppTheme.accent.withValues(alpha: 0.6),
                  AppTheme.accent.withValues(alpha: 0.0),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.accent.withValues(alpha: 0.4),
                  blurRadius: 60,
                  spreadRadius: 30,
                ),
              ],
            ),
          ).animate(onPlay: (controller) => controller.repeat(reverse: true))
           .scale(begin: const Offset(0.8, 0.8), end: const Offset(1.5, 1.5), duration: 2000.ms, curve: Curves.easeInOut)
           .fade(begin: 0.3, end: 1.0, duration: 2000.ms),
           
          const SizedBox(height: 60),
          Text(
            "Breathe in...",
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: AppTheme.accent,
              letterSpacing: 2,
            ),
          ).animate(onPlay: (controller) => controller.repeat(reverse: true))
           .fade(duration: 2000.ms),
        ],
      ),
    ).animate().fade(duration: 500.ms).then(delay: 3000.ms).fadeOut(duration: 500.ms);
  }
}
