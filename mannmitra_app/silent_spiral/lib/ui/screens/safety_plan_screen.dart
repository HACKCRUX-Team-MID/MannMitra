import 'package:flutter/material.dart';
import 'package:silent_spiral/core/theme.dart';

class SafetyPlanScreen extends StatelessWidget {
  const SafetyPlanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Safety Plan"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Emergency Support",
              style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    color: AppTheme.terracotta,
                    fontSize: 32,
                  ),
            ),
            const SizedBox(height: 16),
            Text(
              "If you are feeling overwhelmed, remember you are not alone. Please reach out to one of the resources below:",
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 48),
            _buildResourceCard(
              context,
              "National Crisis Hotline",
              "Call or text 988",
              Icons.phone_in_talk,
            ),
            const SizedBox(height: 20),
            _buildResourceCard(
              context,
              "Crisis Text Line",
              "Text HOME to 741741",
              Icons.sms,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResourceCard(BuildContext context, String title, String subtitle, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDarkElevated,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.terracotta.withOpacity(0.3), width: 1.5),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.terracotta.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppTheme.terracotta, size: 28),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
