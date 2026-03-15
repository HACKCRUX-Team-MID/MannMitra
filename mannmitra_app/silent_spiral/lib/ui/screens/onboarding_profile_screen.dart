import 'package:flutter/material.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/ui/widgets/custom_button.dart';

import 'package:silent_spiral/models/user_profile.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:silent_spiral/services/local_storage_service.dart';

/// Shown on first launch. Gathers context for the AI Engine and requires explicit consent.
class OnboardingProfileScreen extends ConsumerStatefulWidget {
  final VoidCallback onConsented;
  const OnboardingProfileScreen({super.key, required this.onConsented});

  @override
  ConsumerState<OnboardingProfileScreen> createState() => _OnboardingProfileScreenState();
}

class _OnboardingProfileScreenState extends ConsumerState<OnboardingProfileScreen> {
  bool _consentChecked = false;
  final TextEditingController _occupationController = TextEditingController();
  final TextEditingController _stressorsController = TextEditingController();

  @override
  void dispose() {
    _occupationController.dispose();
    _stressorsController.dispose();
    super.dispose();
  }

  void _completeOnboarding() async {
     if (!_consentChecked) return;
     
     final profile = UserProfile(
       occupation: _occupationController.text.trim().isEmpty ? 'none' : _occupationController.text.trim(),
       hobbies: [], // Omit for brief onboarding, can add later in settings
       interests: [], 
       dailyStressors: _stressorsController.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
     );

     final localDb = ref.read(localStorageProvider);
     await localDb.saveUserProfile(profile);
     
     widget.onConsented();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Icon(Icons.psychology_rounded, size: 64, color: AppTheme.accent.withValues(alpha: 0.8)),
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
              const SizedBox(height: 12),
              Center(
                child: Text(
                  "To help our AI provide better context-aware insights, tell us a bit about yourself. This stays 100% on your device.",
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 40),
              
              // Profiling Form
              Text("What is your occupation? (Optional)", style: TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextField(
                controller: _occupationController,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: "e.g., Student, Software Engineer",
                  hintStyle: TextStyle(color: AppTheme.textSecondary.withValues(alpha: 0.5)),
                  filled: true,
                  fillColor: AppTheme.surfaceDarkElevated,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              
              const SizedBox(height: 24),
              Text("Any specific daily stressors? (Optional)", style: TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextField(
                controller: _stressorsController,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: "e.g., commute, exams, finances (comma separated)",
                  hintStyle: TextStyle(color: AppTheme.textSecondary.withValues(alpha: 0.5)),
                  filled: true,
                  fillColor: AppTheme.surfaceDarkElevated,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              
              const SizedBox(height: 48),

              // Consent Blocks
              _buildInfoBlock(
                Icons.lock_rounded,
                "Local-Only Storage & AI",
                "Your journal entries, profile, and emotion analysis run locally using an on-device TFLite model. Nothing is uploaded to the cloud.",
              ),
              const SizedBox(height: 16),
              _buildInfoBlock(
                Icons.edit_note_rounded,
                "Reflection Tool",
                "This app helps you reflect on your thoughts and moods. It is not a clinical diagnostic tool.",
              ),
              const SizedBox(height: 32),
              
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Checkbox(
                    value: _consentChecked,
                    onChanged: (val) => setState(() => _consentChecked = val ?? false),
                    activeColor: AppTheme.accent,
                    side: const BorderSide(color: AppTheme.textSecondary),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _consentChecked = !_consentChecked),
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(
                          "I understand this is a reflection tool and I consent to local AI data processing.",
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
                  text: "Enter MannMitra",
                  icon: Icons.arrow_forward_rounded,
                  onPressed: _consentChecked ? _completeOnboarding : () {},
                ),
              ),
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
        Icon(icon, color: AppTheme.accent, size: 22),
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
