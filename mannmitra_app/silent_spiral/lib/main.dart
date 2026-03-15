import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/services/local_storage_service.dart';
import 'package:silent_spiral/ui/screens/dashboard_screen.dart';
import 'package:silent_spiral/ui/screens/onboarding_profile_screen.dart';
import 'package:silent_spiral/services/notification_service.dart';
import 'package:silent_spiral/l10n/locale_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await Firebase.initializeApp();
  } catch (e) {
    // Firebase not configured. Running in local-only mode.
  }

  final localStorage = LocalStorageService();
  await localStorage.init();

  runApp(
    ProviderScope(
      overrides: [
        localStorageProvider.overrideWithValue(localStorage),
      ],
      child: MannMitraApp(hasConsented: localStorage.hasConsented()),
    ),
  );
}

class MannMitraApp extends ConsumerStatefulWidget {
  final bool hasConsented;
  const MannMitraApp({super.key, required this.hasConsented});

  @override
  ConsumerState<MannMitraApp> createState() => _MannMitraAppState();
}

class _MannMitraAppState extends ConsumerState<MannMitraApp> {
  late bool _hasConsented;

  @override
  void initState() {
    super.initState();
    _hasConsented = widget.hasConsented;
    _initNotifications();
  }

  Future<void> _initNotifications() async {
    final notifier = ref.read(notificationServiceProvider);
    await notifier.initialize();
    await notifier.scheduleDailyCheckIn();
  }

  void _onConsented() {
    final localStorage = ref.read(localStorageProvider);
    localStorage.setConsented(true);
    setState(() => _hasConsented = true);
  }

  @override
  Widget build(BuildContext context) {
    final locale = ref.watch(localeProvider);
    return MaterialApp(
      title: 'MannMitra',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      locale: locale,
      supportedLocales: const [
        Locale('en'),
        Locale('hi'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: _hasConsented
          ? const DashboardScreen()
          : OnboardingProfileScreen(onConsented: _onConsented),
    );
  }
}
