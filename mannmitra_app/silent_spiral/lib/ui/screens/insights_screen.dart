import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/ui/widgets/glass_container.dart';
import 'package:silent_spiral/ui/widgets/animated_background_orbs.dart';
import 'package:silent_spiral/services/local_storage_service.dart';
import 'package:silent_spiral/services/llm_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:silent_spiral/models/journal_entry.dart';
import 'package:silent_spiral/ui/widgets/custom_button.dart';

class InsightsScreen extends ConsumerStatefulWidget {
  const InsightsScreen({super.key});

  @override
  ConsumerState<InsightsScreen> createState() => _InsightsScreenState();
}

class _InsightsScreenState extends ConsumerState<InsightsScreen> {
  List<JournalEntry> _entries = [];
  bool _isGeneratingSummary = false;
  String? _weeklySummary;

  @override
  void initState() {
    super.initState();
    _loadEntries();
  }

  void _loadEntries() {
    final localDb = ref.read(localStorageProvider);
    setState(() {
      _entries = localDb.getAllEntries()
        ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
    });
  }

  Future<void> _generateSummary() async {
    setState(() => _isGeneratingSummary = true);
    final llm = ref.read(llmServiceProvider);
    
    // Get last 7 days text
    final sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7));
    final recentEntriesText = _entries
        .where((e) => e.timestamp.isAfter(sevenDaysAgo))
        .map((e) => e.text)
        .toList();

    try {
      final localDb = ref.read(localStorageProvider);
      final slope = localDb.getWeeklyEmotionSlope();
      final summary = llm.generateWeeklySummary(recentEntriesText, slope: slope);
      setState(() => _weeklySummary = summary);
    } catch (e) {
       setState(() => _weeklySummary = "Error generating summary. Please try again later.");
    } finally {
      setState(() => _isGeneratingSummary = false);
    }
  }

  void _exportData() {
    if (_entries.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No data to export.')),
      );
      return;
    }

    // Generate CSV
    final buffer = StringBuffer();
    buffer.writeln("Timestamp,Primary Emotion,Intensity Score,Journal Text");
    for (var e in _entries) {
      // Escape quotes and commas
      final safeText = e.text.replaceAll('"', '""');
      final date = "${e.timestamp.year}-${e.timestamp.month.toString().padLeft(2, '0')}-${e.timestamp.day.toString().padLeft(2, '0')}";
      buffer.writeln('"$date","${e.primaryEmotion}","${e.intensityScore}","$safeText"');
    }

    Clipboard.setData(ClipboardData(text: buffer.toString())).then((_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('✅ Your data is securely copied to your clipboard as a CSV!'),
            backgroundColor: AppTheme.accent,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Pattern Recognition',
          style: Theme.of(context).textTheme.titleLarge,
        ),
      ),
      body: Stack(
        children: [
          const AnimatedBackgroundOrbs(),
          if (_entries.isEmpty)
            const Center(child: Text("Not enough data to map rhythms. Keep journaling!"))
          else
            ListView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16),
              children: [
                _buildWeeklySummarySection(),
                const SizedBox(height: 32),
                _buildMoodHeatmap(),
                const SizedBox(height: 32),
                _buildIntensityChart(),
                const SizedBox(height: 32),
                _buildTagUsageChart(),
                const SizedBox(height: 48),
                _buildPrivacyExportSection(),
                const SizedBox(height: 48),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildWeeklySummarySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "Weekly AI Summary",
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppTheme.accent,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (_weeklySummary == null && !_isGeneratingSummary)
              TextButton(
                onPressed: _generateSummary,
                child: Text("Generate ✨", style: TextStyle(color: AppTheme.warmGold)),
              )
          ],
        ),
        const SizedBox(height: 12),
        if (_isGeneratingSummary)
           const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: AppTheme.accent)))
        else if (_weeklySummary != null)
           GlassContainer(
             baseColor: AppTheme.accent.withValues(alpha: 0.1),
             borderColor: AppTheme.accent.withValues(alpha: 0.3),
             borderRadius: BorderRadius.circular(20),
             padding: const EdgeInsets.all(20),
             child: Text(
               _weeklySummary!,
               style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                 color: AppTheme.textPrimary,
                 height: 1.5,
               ),
             ),
           )
        else
           GlassContainer(
             baseColor: AppTheme.surfaceDarkElevated,
             borderColor: AppTheme.surfaceDarkBorder,
             borderRadius: BorderRadius.circular(20),
             padding: const EdgeInsets.all(20),
             child: Text(
               "Tap Generate to compile an objective summary of your emotional landscape over the last 7 days.",
               style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                 color: AppTheme.textSecondary,
                 fontStyle: FontStyle.italic,
               ),
             ),
           )
      ],
    );
  }

  Widget _buildMoodHeatmap() {
    // Build a 30-day view
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    List<Widget> days = [];
    
    for (int i = 29; i >= 0; i--) {
      final targetDate = today.subtract(Duration(days: i));
      
      // Find entry for this day
      final entryForDay = _entries.lastWhere(
        (e) => e.timestamp.year == targetDate.year && e.timestamp.month == targetDate.month && e.timestamp.day == targetDate.day,
        orElse: () => JournalEntry(id: 'null', text: '', timestamp: DateTime(2000), primaryEmotion: 'none', intensityScore: 0),
      );

      Color boxColor = AppTheme.surfaceDarkElevated;
      if (entryForDay.id != 'null') {
         boxColor = _getEmotionColor(entryForDay.primaryEmotion ?? 'none').withValues(alpha: 0.6 + ((entryForDay.intensityScore ?? 5) / 20)); // scale opacity by intensity
      }

      days.add(
        Container(
          margin: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: boxColor,
            borderRadius: BorderRadius.circular(8),
            border: entryForDay.id == 'null' ? Border.all(color: AppTheme.surfaceDarkBorder) : null,
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "30-Day Mood Heatmap",
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: AppTheme.accent,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        GlassContainer(
          baseColor: AppTheme.surfaceDarkElevated,
          borderColor: AppTheme.surfaceDarkBorder,
          borderRadius: BorderRadius.circular(24),
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              GridView.count(
                crossAxisCount: 7,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: days,
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLegendItem("Joy", AppTheme.warmGold),
                  const SizedBox(width: 8),
                  _buildLegendItem("Sadness", AppTheme.cyan),
                  const SizedBox(width: 8),
                  _buildLegendItem("Stress/Anger", AppTheme.terracotta),
                  const SizedBox(width: 8),
                  _buildLegendItem("Fatigue", AppTheme.deepOceanBlue),
                ],
              )
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
      ],
    );
  }

  Color _getEmotionColor(String emotion) {
    switch (emotion.toLowerCase()) {
      case 'joy': case 'peaceful': return AppTheme.warmGold;
      case 'sadness': return AppTheme.cyan;
      case 'anger': case 'fear': case 'apprehension': return AppTheme.terracotta;
      case 'fatigue': return AppTheme.deepOceanBlue;
      default: return AppTheme.accent;
    }
  }

  Widget _buildIntensityChart() {
    List<FlSpot> spots = [];
    for (int i = 0; i < _entries.length; i++) {
        double score = (_entries[i].intensityScore ?? 5).toDouble();
        spots.add(FlSpot(i.toDouble(), score));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Emotional Intensity Over Time",
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: AppTheme.accent,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 200,
          child: GlassContainer(
            baseColor: AppTheme.surfaceDark,
            borderColor: AppTheme.accent.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(24),
            padding: const EdgeInsets.all(24),
            child: LineChart(
              LineChartData(
                minX: 0,
                maxX: (spots.length - 1).toDouble() > 0 ? (spots.length - 1).toDouble() : 1,
                minY: 0,
                maxY: 10,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 2,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(color: AppTheme.surfaceDarkElevated, strokeWidth: 1);
                  },
                ),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 2,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          value.toInt().toString(),
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: AppTheme.terracotta,
                    barWidth: 4,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(
                        radius: 4,
                        color: AppTheme.accent,
                        strokeWidth: 2,
                        strokeColor: AppTheme.backgroundDark,
                      ),
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.terracotta.withValues(alpha: 0.3),
                          AppTheme.terracotta.withValues(alpha: 0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTagUsageChart() {
    if (_entries.isEmpty) return const SizedBox.shrink();

    final tagCounts = <String, int>{};
    final regex = RegExp(r'#\w+');
    
    for (var entry in _entries) {
      if (entry.text.contains("Context Tags:")) {
         final tagsPart = entry.text.split("Context Tags:").last;
         final matches = regex.allMatches(tagsPart);
         for (var match in matches) {
            final tag = match.group(0)!;
            tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
         }
      }
    }

    if (tagCounts.isEmpty) return const SizedBox.shrink();

    // Sort and take top 5
    final sortedTags = tagCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final topTags = sortedTags.take(5).toList();

    List<BarChartGroupData> barGroups = [];
    double maxY = 0;
    
    for (int i = 0; i < topTags.length; i++) {
       double val = topTags[i].value.toDouble();
       if (val > maxY) maxY = val;
       barGroups.add(
         BarChartGroupData(
           x: i,
           barRods: [
             BarChartRodData(
               toY: val,
               color: AppTheme.accent,
               width: 22,
               borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
               backDrawRodData: BackgroundBarChartRodData(
                 show: true,
                 toY: maxY < 5 ? 5 : maxY, // Set a default background height
                 color: AppTheme.surfaceDarkElevated,
               ),
             )
           ]
         )
       );
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Top Contexts",
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: AppTheme.accent,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 220,
          child: GlassContainer(
            baseColor: AppTheme.surfaceDark,
            borderColor: AppTheme.accent.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(24),
            padding: const EdgeInsets.only(top: 24, right: 24, left: 12, bottom: 8),
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceEvenly,
                maxY: maxY < 5 ? 5 : maxY,
                barTouchData: BarTouchData(enabled: false),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 32,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() < 0 || value.toInt() >= topTags.length) return const SizedBox.shrink();
                        return Padding(
                           padding: const EdgeInsets.only(top: 10.0),
                           child: Text(
                             topTags[value.toInt()].key,
                             style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
                           )
                        );
                      }
                    )
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 32,
                      interval: maxY > 5 ? (maxY/5).ceilToDouble() : 1,
                      getTitlesWidget: (value, meta) {
                        if (value == 0 || value % 1 != 0) return const SizedBox.shrink();
                        return Text(value.toInt().toString(), style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12));
                      }
                    )
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxY > 5 ? (maxY/5).ceilToDouble() : 1,
                  getDrawingHorizontalLine: (value) => FlLine(color: AppTheme.surfaceDarkElevated, strokeWidth: 1),
                ),
                borderData: FlBorderData(show: false),
                barGroups: barGroups,
              ),
            ),
          ),
        ),
      ]
    );
  }

  Widget _buildPrivacyExportSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Data Ownership",
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: AppTheme.accent,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        GlassContainer(
          baseColor: AppTheme.surfaceDarkElevated,
          borderColor: AppTheme.surfaceDarkBorder,
          borderRadius: BorderRadius.circular(24),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.shield_rounded, color: AppTheme.warmGold, size: 28),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      "Your Data is Yours",
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                "You have complete ownership of your reflection history. There is no vendor lock-in. Export your data to paste anywhere.",
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: PrimaryButton(
                  text: "Export Data (CSV)",
                  icon: Icons.download_rounded,
                  onPressed: _exportData,
                ),
              )
            ],
          ),
        ),
      ],
    );
  }
}
