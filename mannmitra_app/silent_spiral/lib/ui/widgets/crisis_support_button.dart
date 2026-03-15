import 'package:flutter/material.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/ui/screens/safety_plan_screen.dart';

class CrisisSupportButton extends StatelessWidget {
  const CrisisSupportButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.shield_outlined),
      color: AppTheme.terracotta,
      tooltip: 'Crisis Support',
      onPressed: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const SafetyPlanScreen()),
        );
      },
    );
  }
}
