import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tz;
import 'dart:math';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

class NotificationService {
  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  final List<String> _catchyPrompts = [
    "The spiral has been quiet today. How is your rhythm?",
    "Take a quick breath. What's occupying your mind?",
    "Just a micro-check-in: How are you feeling right now?",
    "Your patterns matter. Log a quick vibe check.",
    "A small reflection goes a long way. Tap to ground yourself."
  ];

  Future<void> initialize() async {
    tz.initializeTimeZones();
    
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const DarwinInitializationSettings initializationSettingsDarwin =
        DarwinInitializationSettings(
      requestSoundPermission: true,
      requestBadgePermission: true,
      requestAlertPermission: true,
    );
    
    const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsDarwin);
        
    await _flutterLocalNotificationsPlugin.initialize(
      settings: initializationSettings,
    );
  }

  Future<void> scheduleDailyCheckIn() async {
    final String randomPrompt = _catchyPrompts[Random().nextInt(_catchyPrompts.length)];

    await _flutterLocalNotificationsPlugin.zonedSchedule(
        id: 0,
        title: "MannMitra",
        body: randomPrompt,
        scheduledDate: _nextInstanceOfEvening(),
        notificationDetails: const NotificationDetails(
            android: AndroidNotificationDetails(
                'daily_checkin_channel', 'Daily Check-ins',
                channelDescription: 'Reminders for daily reflection rhythms',
                importance: Importance.max,
                priority: Priority.high,
                ticker: 'ticker')),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        matchDateTimeComponents: DateTimeComponents.time);
  }

  tz.TZDateTime _nextInstanceOfEvening() {
    final tz.TZDateTime now = tz.TZDateTime.now(tz.local);
    tz.TZDateTime scheduledDate =
        tz.TZDateTime(tz.local, now.year, now.month, now.day, 20, 0); // 8:00 PM evening prompt
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }
    return scheduledDate;
  }
}
