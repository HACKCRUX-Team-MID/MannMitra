import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:silent_spiral/l10n/en_strings.dart';
import 'package:silent_spiral/l10n/hi_strings.dart';

/// Manages the current locale and provides localized strings.
final localeProvider = NotifierProvider<LocaleNotifier, Locale>(LocaleNotifier.new);

class LocaleNotifier extends Notifier<Locale> {
  @override
  Locale build() => const Locale('en');

  void setLocale(Locale locale) {
    state = locale;
  }

  void toggleLanguage() {
    state = state.languageCode == 'en' ? const Locale('hi') : const Locale('en');
  }
}

/// Returns the localized string class based on the current locale.
class AppStrings {
  final Locale locale;
  AppStrings(this.locale);

  // ── Onboarding ──
  String get welcome => _isHindi ? HiStrings.welcome : EnStrings.welcome;
  String get consentTitle => _isHindi ? HiStrings.consentTitle : EnStrings.consentTitle;
  String get consentLocal => _isHindi ? HiStrings.consentLocal : EnStrings.consentLocal;
  String get consentAnalysis => _isHindi ? HiStrings.consentAnalysis : EnStrings.consentAnalysis;
  String get consentDisclaimer => _isHindi ? HiStrings.consentDisclaimer : EnStrings.consentDisclaimer;
  String get consentCheckbox => _isHindi ? HiStrings.consentCheckbox : EnStrings.consentCheckbox;
  String get continueButton => _isHindi ? HiStrings.continueButton : EnStrings.continueButton;

  // ── Dashboard ──
  String get dashboard => _isHindi ? HiStrings.dashboard : EnStrings.dashboard;
  String get streak => _isHindi ? HiStrings.streak : EnStrings.streak;
  String get days => _isHindi ? HiStrings.days : EnStrings.days;
  String get todayVibe => _isHindi ? HiStrings.todayVibe : EnStrings.todayVibe;
  String get recentEntries => _isHindi ? HiStrings.recentEntries : EnStrings.recentEntries;
  String get noEntries => _isHindi ? HiStrings.noEntries : EnStrings.noEntries;

  // ── Journal ──
  String get journalTitle => _isHindi ? HiStrings.journalTitle : EnStrings.journalTitle;
  String get whatFeeling => _isHindi ? HiStrings.whatFeeling : EnStrings.whatFeeling;
  String get writeHere => _isHindi ? HiStrings.writeHere : EnStrings.writeHere;
  String get save => _isHindi ? HiStrings.save : EnStrings.save;
  String get supportiveLens => _isHindi ? HiStrings.supportiveLens : EnStrings.supportiveLens;
  String get reflectionSaved => _isHindi ? HiStrings.reflectionSaved : EnStrings.reflectionSaved;
  String get whyThis => _isHindi ? HiStrings.whyThis : EnStrings.whyThis;
  String get hide => _isHindi ? HiStrings.hide : EnStrings.hide;
  String get wasAccurate => _isHindi ? HiStrings.wasAccurate : EnStrings.wasAccurate;
  String get method => _isHindi ? HiStrings.method : EnStrings.method;
  String get confidence => _isHindi ? HiStrings.confidence : EnStrings.confidence;
  String get disclaimer => _isHindi ? HiStrings.disclaimer : EnStrings.disclaimer;

  // ── Feedback ──
  String get helpLearn => _isHindi ? HiStrings.helpLearn : EnStrings.helpLearn;
  String get saveCorrection => _isHindi ? HiStrings.saveCorrection : EnStrings.saveCorrection;
  String get cancel => _isHindi ? HiStrings.cancel : EnStrings.cancel;
  String get thanksLearning => _isHindi ? HiStrings.thanksLearning : EnStrings.thanksLearning;
  String get thanksNoted => _isHindi ? HiStrings.thanksNoted : EnStrings.thanksNoted;

  // ── Settings ──
  String get settings => _isHindi ? HiStrings.settings : EnStrings.settings;
  String get privacyCenter => _isHindi ? HiStrings.privacyCenter : EnStrings.privacyCenter;
  String get adaptiveLearning => _isHindi ? HiStrings.adaptiveLearning : EnStrings.adaptiveLearning;
  String get crisisResources => _isHindi ? HiStrings.crisisResources : EnStrings.crisisResources;
  String get dangerZone => _isHindi ? HiStrings.dangerZone : EnStrings.dangerZone;
  String get deleteAllData => _isHindi ? HiStrings.deleteAllData : EnStrings.deleteAllData;
  String get deleteConfirmTitle => _isHindi ? HiStrings.deleteConfirmTitle : EnStrings.deleteConfirmTitle;
  String get deleteConfirmMessage => _isHindi ? HiStrings.deleteConfirmMessage : EnStrings.deleteConfirmMessage;
  String get deleteEverything => _isHindi ? HiStrings.deleteEverything : EnStrings.deleteEverything;
  String get dataDeleted => _isHindi ? HiStrings.dataDeleted : EnStrings.dataDeleted;

  bool get _isHindi => locale.languageCode == 'hi';
}
