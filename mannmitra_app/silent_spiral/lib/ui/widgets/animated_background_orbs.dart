import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:silent_spiral/core/theme.dart';

class AnimatedBackgroundOrbs extends StatelessWidget {
  const AnimatedBackgroundOrbs({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          top: -100,
          left: -100,
          child: Container(
            width: 350,
            height: 350,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.accent.withValues(alpha: 0.08),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.accent.withValues(alpha: 0.15),
                  blurRadius: 100,
                  spreadRadius: 80,
                )
              ],
            ),
          ).animate(onPlay: (controller) => controller.repeat(reverse: true))
           .slideX(begin: 0, end: 0.2, duration: 15.seconds, curve: Curves.easeInOut)
           .slideY(begin: 0, end: 0.2, duration: 15.seconds, curve: Curves.easeInOut)
           .scale(begin: const Offset(1, 1), end: const Offset(1.2, 1.2), duration: 10.seconds),
        ),
        Positioned(
          bottom: -50,
          right: -150,
          child: Container(
            width: 400,
            height: 400,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.terracotta.withValues(alpha: 0.06),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.terracotta.withValues(alpha: 0.1),
                  blurRadius: 120,
                  spreadRadius: 90,
                )
              ],
            ),
          ).animate(onPlay: (controller) => controller.repeat(reverse: true))
           .slideX(begin: 0, end: -0.3, duration: 18.seconds, curve: Curves.easeInOut)
           .slideY(begin: 0, end: -0.1, duration: 18.seconds, curve: Curves.easeInOut)
           .scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1), duration: 12.seconds),
        ),
        // Third orb for depth
        Positioned(
          top: MediaQuery.of(context).size.height * 0.4,
          left: MediaQuery.of(context).size.width * 0.3,
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.deepOceanBlue.withValues(alpha: 0.06),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.deepOceanBlue.withValues(alpha: 0.1),
                  blurRadius: 80,
                  spreadRadius: 50,
                )
              ],
            ),
          ).animate(onPlay: (controller) => controller.repeat(reverse: true))
           .slideX(begin: 0, end: 0.3, duration: 20.seconds, curve: Curves.easeInOut)
           .slideY(begin: 0, end: -0.2, duration: 14.seconds, curve: Curves.easeInOut),
        ),
      ],
    );
  }
}
