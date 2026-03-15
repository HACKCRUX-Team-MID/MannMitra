import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/services/health_service.dart';
import 'package:silent_spiral/ui/widgets/crisis_support_button.dart';
import 'package:silent_spiral/ui/screens/journal_screen.dart';
import 'package:silent_spiral/ui/screens/insights_screen.dart';
import 'package:silent_spiral/ui/screens/settings_screen.dart';
import 'package:silent_spiral/ui/widgets/glass_container.dart';
import 'package:silent_spiral/ui/widgets/micro_checkin.dart';
import 'package:silent_spiral/ui/widgets/animated_background_orbs.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:silent_spiral/ui/widgets/emotion_avatar.dart';
import 'package:silent_spiral/services/local_storage_service.dart';
import 'package:silent_spiral/services/spiral_engine.dart';
import 'package:silent_spiral/models/journal_entry.dart';
import 'package:silent_spiral/services/pattern_analyzer_service.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  Map<String, dynamic>? _healthData;
  int _reflectionCount = 0;
  int _streakCount = 0;
  String? _dominantEmotion;
  List<JournalEntry> _recentEntries = [];
  List<double> _mockWeeklySteps = [3500, 4200, 7522, 6100, 8900, 5400, 7800];
  List<double> _mockWeeklySleep = [5.5, 6.2, 8.0, 7.5, 6.0, 5.8, 7.1];
  int _weeklySlope = 0;
  String? _temporalInsight;
  SpiralRiskResult? _spiralResult;
  List<String> _behavioralNudges = [];
  bool _hasSustainedStress = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final healthService = ref.read(healthServiceProvider);
    final data = await healthService.fetchHealthDataSummary();
    
    final localDb = ref.read(localStorageProvider);
    final entries = localDb.getAllEntries();
    
    // Calculate dominant emotion from today's entries
    String? dominant;
    if (entries.isNotEmpty) {
      final today = DateTime.now();
      final todayEntries = entries.where((e) =>
        e.timestamp.year == today.year &&
        e.timestamp.month == today.month &&
        e.timestamp.day == today.day
      ).toList();
      
      if (todayEntries.isNotEmpty) {
        dominant = todayEntries.last.primaryEmotion;
      } else {
        dominant = entries.last.primaryEmotion;
      }
    }

    if (mounted) {
      // Compute slope & temporal insight
      final slope = localDb.getWeeklyEmotionSlope();
      final temporal = localDb.getTemporalInsight();

      // Run spiral risk assessment
      final spiralEngine = ref.read(spiralEngineProvider);
      final spiralResult = spiralEngine.calculateRisk(
        recentEntries: entries,
        healthData: data,
      );

      // Generate AI Behavioral Nudges
      final patternAnalyzer = ref.read(patternAnalyzerProvider);
      final sleepHours = (data['sleep_duration_hours'] as num?)?.toInt() ?? 8;
      final nudges = patternAnalyzer.generateBehavioralNudges(sleepHours);
      final hasStress = patternAnalyzer.isExperiencingSustainedStress();

      setState(() {
        _healthData = data;
        _reflectionCount = entries.length;
        _streakCount = localDb.calculateStreak();
        _dominantEmotion = dominant;
        _recentEntries = entries;
        _weeklySlope = slope;
        _temporalInsight = temporal;
        _spiralResult = spiralResult;
        _behavioralNudges = nudges;
        _hasSustainedStress = hasStress;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'MannMitra',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(letterSpacing: 1.2),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_rounded, size: 24),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
            tooltip: "Settings & Privacy",
          ),
          const CrisisSupportButton(),
        ],
      ),
      body: Stack(
        children: [
          const AnimatedBackgroundOrbs(),
          _healthData == null
              ? const Center(child: CircularProgressIndicator(color: AppTheme.accent))
              : RefreshIndicator(
                  color: AppTheme.accent,
                  backgroundColor: AppTheme.surfaceDarkElevated,
                  onRefresh: _loadData,
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                    children: [
                      // Emotion Avatar replaces the Spiral
                      EmotionAvatar(
                        dominantEmotion: _dominantEmotion,
                        reflectionCount: _reflectionCount,
                      ),
                      const SizedBox(height: 24),
                      MicroCheckIn(
                        onLogRhythm: (val) {
                           debugPrint("Logged vibe: $val");
                        }
                      ).animate().fade().slideY(begin: 0.1),
                      const SizedBox(height: 48),
                      // Direction indicator
                      _buildDirectionIndicator(),
                      const SizedBox(height: 16),
                      // Temporal insight
                      if (_temporalInsight != null)
                        _buildTemporalInsightCard(),
                      if (_temporalInsight != null)
                        const SizedBox(height: 16),
                      // Spiral alert (gentle, never shows score)
                      if (_spiralResult != null && _spiralResult!.shouldAlert)
                        _buildSpiralAlertCard(),
                      if (_spiralResult != null && _spiralResult!.shouldAlert)
                        const SizedBox(height: 16),
                      if (_behavioralNudges.isNotEmpty)
                        ..._behavioralNudges.map((nudge) => Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _buildNudgeCard(nudge),
                        )),
                      if (_hasSustainedStress)
                        _buildSupportResourcesCard(),
                      if (_hasSustainedStress)
                        const SizedBox(height: 16),
                      _buildNonEvaluativeSummary(),
                      const SizedBox(height: 100),
                    ].animate(interval: 100.ms).fade(duration: 600.ms).slideY(begin: 0.1, duration: 600.ms),
                  ),
                ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            FloatingActionButton(
              heroTag: 'insights',
              backgroundColor: AppTheme.surfaceDarkElevated,
              foregroundColor: AppTheme.textPrimary,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const InsightsScreen()),
                );
              },
              child: const Icon(Icons.bar_chart_rounded, size: 28),
            ).animate().scale(delay: 500.ms, duration: 400.ms),
            FloatingActionButton.extended(
              heroTag: 'reflect',
              backgroundColor: AppTheme.accent,
              foregroundColor: AppTheme.backgroundDark,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              onPressed: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const JournalScreen()),
                );
                _loadData();
              },
              icon: const Icon(Icons.edit_note, size: 28),
              label: Text(
                "Reflect",
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppTheme.backgroundDark,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ).animate().scale(delay: 500.ms, duration: 400.ms),
          ],
        ),
      ),
    );
  }

  Widget _buildNonEvaluativeSummary() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Recent Rhythms",
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: AppTheme.accent,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 20),
        _buildGraphCard(
          "🏃 Movement (Last 7 Days)", 
          "avg steps", 
          AppTheme.terracotta, 
          _mockWeeklySteps, 
          isBarChart: true,
          maxY: 10000,
        ),
        const SizedBox(height: 16),
        _buildGraphCard(
          "🌙 Rest (Last 7 Days)", 
          "avg hours", 
          AppTheme.deepOceanBlue, 
          _mockWeeklySleep, 
          isBarChart: false,
          maxY: 12,
        ),
        const SizedBox(height: 16),
        
        // Reflections Graph
        _buildReflectionsGraph(),
        const SizedBox(height: 16),
        
        // Streak Card (kept aesthetic, streak is a single escalating number, hard to bar-chart effectively without history)
        GlassContainer(
          baseColor: AppTheme.warmGold.withValues(alpha: 0.05),
          borderColor: AppTheme.warmGold.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(24),
          padding: const EdgeInsets.all(24),
          child: Row(
             mainAxisAlignment: MainAxisAlignment.spaceBetween,
             children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("🔥 Current Streak", style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 15)),
                    const SizedBox(height: 12),
                    Text("$_streakCount days", style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppTheme.textPrimary)),
                  ]
                ),
                const Icon(Icons.local_fire_department_rounded, color: AppTheme.warmGold, size: 48),
             ]
          )
        )
      ],
    );
  }

  Widget _buildReflectionsGraph() {
     // Aggregate entries by day for the last 7 days
     final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
     List<double> counts = List.filled(7, 0);
     
     for (var entry in _recentEntries) {
        final diff = today.difference(DateTime(entry.timestamp.year, entry.timestamp.month, entry.timestamp.day)).inDays;
        if (diff >= 0 && diff < 7) {
           counts[6 - diff]++; // 0 is 7 days ago, 6 is today
        }
     }

     return _buildGraphCard(
       "📖 Reflections (Last 7 Days)", 
       "total entries", 
       AppTheme.accent, 
       counts, 
       isBarChart: true,
       maxY: 5
     );
  }

  Widget _buildGraphCard(String title, String subtitle, Color color, List<double> data, {required bool isBarChart, required double maxY}) {
    List<BarChartGroupData> barGroups = [];
    List<FlSpot> lineSpots = [];

    for (int i = 0; i < data.length; i++) {
      if (isBarChart) {
        barGroups.add(
          BarChartGroupData(
            x: i,
            barRods: [
              BarChartRodData(
                toY: data[i],
                color: color,
                width: 14,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                backDrawRodData: BackgroundBarChartRodData(
                  show: true,
                  toY: maxY,
                  color: AppTheme.surfaceDarkElevated,
                ),
              )
            ]
          )
        );
      } else {
        lineSpots.add(FlSpot(i.toDouble(), data[i]));
      }
    }

    return GlassContainer(
      baseColor: AppTheme.surfaceDarkElevated,
      borderColor: AppTheme.surfaceDarkBorder,
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 15)),
          const SizedBox(height: 24),
          SizedBox(
            height: 120,
            child: isBarChart 
             ? BarChart(
                 BarChartData(
                   alignment: BarChartAlignment.spaceAround,
                   maxY: maxY,
                   barTouchData: BarTouchData(enabled: false),
                   titlesData: const FlTitlesData(show: false),
                   gridData: const FlGridData(show: false),
                   borderData: FlBorderData(show: false),
                   barGroups: barGroups,
                 )
               )
             : LineChart(
                 LineChartData(
                   minX: 0, maxX: 6, minY: 0, maxY: maxY,
                   gridData: const FlGridData(show: false),
                   titlesData: const FlTitlesData(show: false),
                   borderData: FlBorderData(show: false),
                   lineBarsData: [
                     LineChartBarData(
                       spots: lineSpots,
                       isCurved: true,
                       color: color,
                       barWidth: 3,
                       isStrokeCapRound: true,
                       dotData: const FlDotData(show: false),
                       belowBarData: BarAreaData(
                         show: true,
                         gradient: LinearGradient(
                           colors: [color.withValues(alpha: 0.3), color.withValues(alpha: 0.0)],
                           begin: Alignment.topCenter, end: Alignment.bottomCenter,
                         )
                       )
                     )
                   ]
                 )
               )
          )
        ],
      ),
    );
  }

  // ── Direction Indicator: ↑ / → / ↓ ──
  Widget _buildDirectionIndicator() {
    String arrow;
    String label;
    Color color;

    if (_weeklySlope > 0) {
      arrow = '↑'; label = 'Improving'; color = AppTheme.accent;
    } else if (_weeklySlope < 0) {
      arrow = '↓'; label = 'Declining'; color = AppTheme.terracotta;
    } else {
      arrow = '→'; label = 'Stable'; color = AppTheme.warmGold;
    }

    return GlassContainer(
      baseColor: AppTheme.surfaceDarkElevated,
      borderColor: color.withValues(alpha: 0.4),
      borderRadius: BorderRadius.circular(16),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          Text(arrow, style: TextStyle(fontSize: 28, color: color)),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("This Week's Direction", style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.w700)),
            ],
          ),
          const Spacer(),
          Text(
            '$_streakCount day streak 🔥',
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
          ),
        ],
      ),
    );
  }

  // ── Temporal Insight Card ──
  Widget _buildTemporalInsightCard() {
    return GlassContainer(
      baseColor: AppTheme.deepOceanBlue.withValues(alpha: 0.08),
      borderColor: AppTheme.deepOceanBlue.withValues(alpha: 0.3),
      borderRadius: BorderRadius.circular(16),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Text('🔮', style: TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your Pattern', style: TextStyle(color: AppTheme.cyan, fontSize: 11, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(
                  _temporalInsight!,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── AI Behavioral Nudge Card ──
  Widget _buildNudgeCard(String message) {
    return GlassContainer(
      baseColor: AppTheme.accent.withValues(alpha: 0.1),
      borderColor: AppTheme.accent.withValues(alpha: 0.3),
      borderRadius: BorderRadius.circular(16),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('💡', style: TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('AI Insight', style: TextStyle(color: AppTheme.accent, fontSize: 11, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Spiral Alert Card (gentle only, never shows score) ──
  Widget _buildSpiralAlertCard() {
    return GlassContainer(
      baseColor: AppTheme.terracotta.withValues(alpha: 0.08),
      borderColor: AppTheme.terracotta.withValues(alpha: 0.4),
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.terracotta.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.favorite_border_rounded, color: AppTheme.terracotta, size: 22),
              ),
              const SizedBox(width: 12),
              Text(
                'A gentle check-in',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppTheme.terracotta,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            _spiralResult!.gentleMessage,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textPrimary,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                _showSupportDialog();
              },
              icon: const Icon(Icons.phone_in_talk_rounded, size: 18),
              label: const Text('I want to talk to someone'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.terracotta,
                side: BorderSide(color: AppTheme.terracotta.withValues(alpha: 0.5)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── AI Driven Support Resources Card ──
  Widget _buildSupportResourcesCard() {
    return GlassContainer(
      baseColor: AppTheme.deepOceanBlue.withValues(alpha: 0.08),
      borderColor: AppTheme.deepOceanBlue.withValues(alpha: 0.3),
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.deepOceanBlue.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.spa_rounded, color: AppTheme.cyan, size: 22),
              ),
              const SizedBox(width: 12),
              Text(
                'Support Resources',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppTheme.cyan,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            "It looks like you've been carrying a heavy load over the past few days. Here are some tools that might help ground you.",
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textPrimary,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {}, // Breathing exercise placeholder
                  icon: const Icon(Icons.air_rounded, size: 18),
                  label: const Text('Breathe'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.cyan,
                    side: BorderSide(color: AppTheme.cyan.withValues(alpha: 0.5)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: _showSupportDialog,
                  icon: const Icon(Icons.people_alt_rounded, size: 18),
                  label: const Text('Helplines'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.cyan.withValues(alpha: 0.2),
                    foregroundColor: AppTheme.cyan,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Center(
             child: Text(
               "Note: This is not a clinical diagnosis or medical advice.",
               style: TextStyle(color: AppTheme.textSecondary.withValues(alpha: 0.6), fontSize: 10, fontStyle: FontStyle.italic),
             ),
          )
        ],
      ),
    );
  }
  
  void _showSupportDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Talk to Someone 💛', style: TextStyle(color: AppTheme.warmGold)),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('🇮🇳 iCall: 9152987821', style: TextStyle(color: AppTheme.textPrimary, fontSize: 14)),
            SizedBox(height: 8),
            Text('🇮🇳 Vandrevala Foundation: 1860 2662 345', style: TextStyle(color: AppTheme.textPrimary, fontSize: 14)),
            SizedBox(height: 8),
            Text('🌍 Crisis Text Line: Text HOME to 741741', style: TextStyle(color: AppTheme.textPrimary, fontSize: 14)),
            SizedBox(height: 16),
            Text('You are not alone. Reaching out is strength.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontStyle: FontStyle.italic)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close', style: TextStyle(color: AppTheme.accent)),
          ),
        ],
      ),
    );
  }
}
