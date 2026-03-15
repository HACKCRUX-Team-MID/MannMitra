import 'package:flutter/material.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/ui/widgets/custom_button.dart';

/// Shown on first launch, requiring explicit user consent before the app can be used.
/// Defaults to Local-Only storage. No data leaves the device unless the user explicitly opts in.
class OnboardingConsentScreen extends StatefulWidget {
  final VoidCallback onConsented;
  const OnboardingConsentScreen({super.key, required this.onConsented});

  @override
  State<OnboardingConsentScreen> createState() => _OnboardingConsentScreenState();
}

class _OnboardingConsentScreenState extends State<OnboardingConsentScreen> {
  bool _consentChecked = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDeep,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Center(
                child: Icon(Icons.shield_rounded, size: 64, color: AppTheme.accentPurple.withValues(alpha: 0.8)),
              ),
              const SizedBox(height: 24),
              Center(
                child: Text(
                  "Welcome to MannMitra",
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: AppTheme.textPrimary,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 32),
              _buildInfoBlock(
                Icons.edit_note_rounded,
                "Reflection Tool",
                "This app helps you reflect on your thoughts and moods. It is not a clinical diagnostic tool and does not provide medical advice.",
              ),
              const SizedBox(height: 16),
              _buildInfoBlock(
                Icons.lock_rounded,
                "Local-Only Storage (Default)",
                "Your journal entries and data are stored only on this device. Nothing is uploaded to the cloud unless you explicitly enable it.",
              ),
              const SizedBox(height: 16),
              _buildInfoBlock(
                Icons.psychology_alt_rounded,
                "On-Device Analysis",
                "Emotion detection uses a local lexicon+rules engine. Your text is never sent to external servers for processing.",
              ),
              const SizedBox(height: 16),
              _buildInfoBlock(
                Icons.download_rounded,
                "Your Data, Your Control",
                "You can export or permanently delete all your data at any time from Settings.",
              ),
              const Spacer(),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Checkbox(
                    value: _consentChecked,
                    onChanged: (val) => setState(() => _consentChecked = val ?? false),
                    activeColor: AppTheme.accentPurple,
                    side: const BorderSide(color: AppTheme.textSecondary),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _consentChecked = !_consentChecked),
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(
                          "I understand that this is a reflection tool, not a medical diagnostic tool, and I consent to local data processing.",
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: PrimaryButton(
                  text: "Continue (Local-Only)",
                  icon: Icons.arrow_forward_rounded,
                  onPressed: _consentChecked ? widget.onConsented : () {},
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoBlock(IconData icon, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppTheme.accentPurple, size: 22),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppTheme.textPrimary, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(desc, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textSecondary, height: 1.4)),
            ],
          ),
        ),
      ],
    );
  }
}
